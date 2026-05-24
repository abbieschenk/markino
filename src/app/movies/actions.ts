"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  movieRankings,
  movies,
  users,
  watchEntries,
  watchEntryParticipants,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getVisibleMovieIdsForUser } from "@/lib/movies";

const VALID_STATUSES = new Set(["watched", "dnf", "dns"] as const);
type WatchStatusValue = "watched" | "dnf" | "dns";

function parseWatchStatus(value: string): WatchStatusValue | null {
  if (!VALID_STATUSES.has(value as WatchStatusValue)) {
    return null;
  }

  return value as WatchStatusValue;
}

export async function addMovieEntry(
  formData: FormData,
): Promise<{ status: "idle" | "error" | "success"; message: string | null }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "You must be signed in to add a movie.",
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const watchedOn = String(formData.get("watchedOn") ?? "").trim();
  const languageWatched =
    String(formData.get("languageWatched") ?? "").trim() || "English";
  const rawStatus = String(formData.get("status") ?? "watched")
    .trim()
    .toLowerCase();
  const watchedWithHandles = Array.from(
    new Set(
      formData
        .getAll("watchedWith")
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  if (!title) {
    return {
      status: "error",
      message: "Title is required.",
    };
  }

  if (!watchedOn) {
    return {
      status: "error",
      message: "Date watched is required.",
    };
  }

  const status = parseWatchStatus(rawStatus);

  if (!status) {
    return {
      status: "error",
      message: "Watch status is invalid.",
    };
  }

  const participantHandles = watchedWithHandles.filter(
    (handle) => handle !== session.user.handle,
  );

  const participantUsers =
    participantHandles.length > 0
      ? await db
          .select({ id: users.id, handle: users.handle })
          .from(users)
          .where(inArray(users.handle, participantHandles))
      : [];

  if (participantUsers.length !== participantHandles.length) {
    return {
      status: "error",
      message: "One or more selected handles could not be found.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      const normalizedTitle = title.toLocaleLowerCase();
      const existingMovie = await tx.query.movies.findFirst({
        where: sql`lower(${movies.title}) = ${normalizedTitle}`,
        columns: {
          id: true,
        },
      });

      const movie =
        existingMovie ??
        (
          await tx
            .insert(movies)
            .values({
              title,
            })
            .returning({ id: movies.id })
        )[0];

      const [watchEntry] = await tx
        .insert(watchEntries)
        .values({
          userId: session.user.id,
          movieId: movie.id,
          watchedOn,
          languageWatched,
          status,
        })
        .returning({ id: watchEntries.id });

      if (participantUsers.length > 0) {
        await tx.insert(watchEntryParticipants).values(
          participantUsers.map((user) => ({
            watchEntryId: watchEntry.id,
            userId: user.id,
          })),
        );
      }
    });
  } catch (error) {
    console.error("Failed to add movie entry", error);

    return {
      status: "error",
      message: "Unable to save the movie entry.",
    };
  }

  revalidatePath("/movies");
  revalidatePath("/");

  return {
    status: "success",
    message: "Movie entry saved.",
  };
}

export async function deleteMovieEntry(
  watchEntryId: string,
): Promise<{ status: "error" | "success"; message: string | null }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "You must be signed in to delete a movie.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      const watchEntry = await tx.query.watchEntries.findFirst({
        where: eq(watchEntries.id, watchEntryId),
        columns: {
          id: true,
          userId: true,
          movieId: true,
        },
      });

      if (!watchEntry) {
        throw new Error("WATCH_ENTRY_NOT_FOUND");
      }

      if (watchEntry.userId === session.user.id) {
        await tx.delete(watchEntries).where(eq(watchEntries.id, watchEntry.id));
      } else {
        const participantLink = await tx.query.watchEntryParticipants.findFirst({
          where: and(
            eq(watchEntryParticipants.watchEntryId, watchEntry.id),
            eq(watchEntryParticipants.userId, session.user.id),
          ),
          columns: {
            userId: true,
          },
        });

        if (!participantLink) {
          throw new Error("WATCH_ENTRY_FORBIDDEN");
        }

        await tx.delete(watchEntryParticipants).where(
          and(
            eq(watchEntryParticipants.watchEntryId, watchEntry.id),
            eq(watchEntryParticipants.userId, session.user.id),
          ),
        );
      }

      await tx.delete(movieRankings).where(
        and(
          eq(movieRankings.userId, session.user.id),
          eq(movieRankings.movieId, watchEntry.movieId),
        ),
      );
    });
  } catch (error) {
    console.error("Failed to delete movie entry", error);

    return {
      status: "error",
      message: "Unable to delete the movie entry.",
    };
  }

  revalidatePath("/movies");
  revalidatePath("/");

  return {
    status: "success",
    message: null,
  };
}

export async function reorderMovieRankings(
  orderedMovieIds: string[],
): Promise<{ status: "error" | "success"; message: string | null }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "You must be signed in to reorder movies.",
    };
  }

  const uniqueOrderedMovieIds = Array.from(new Set(orderedMovieIds));

  if (uniqueOrderedMovieIds.length !== orderedMovieIds.length) {
    return {
      status: "error",
      message: "Movie order contains duplicates.",
    };
  }

  const visibleMovieIds = await getVisibleMovieIdsForUser(session.user.id);
  const visibleMovieIdSet = new Set(visibleMovieIds);
  const hasSameMovieSet =
    uniqueOrderedMovieIds.length === visibleMovieIds.length &&
    uniqueOrderedMovieIds.every((movieId) => visibleMovieIdSet.has(movieId));

  if (!hasSameMovieSet) {
    return {
      status: "error",
      message: "Movie order is out of date. Refresh and try again.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(movieRankings)
        .where(eq(movieRankings.userId, session.user.id));

      if (uniqueOrderedMovieIds.length > 0) {
        await tx.insert(movieRankings).values(
          uniqueOrderedMovieIds.map((movieId, index) => ({
            userId: session.user.id,
            movieId,
            rank: index + 1,
          })),
        );
      }
    });
  } catch (error) {
    console.error("Failed to reorder movie rankings", error);

    return {
      status: "error",
      message: "Unable to save the movie order.",
    };
  }

  revalidatePath("/movies");
  revalidatePath("/");

  return {
    status: "success",
    message: null,
  };
}
