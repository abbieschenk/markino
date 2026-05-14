"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { movies, users, watchEntries, watchEntryParticipants } from "@/db/schema";
import { auth } from "@/lib/auth";

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
  const languageWatched = String(formData.get("languageWatched") ?? "").trim();
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

  if (!languageWatched) {
    return {
      status: "error",
      message: "Language watched is required.",
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

  return {
    status: "success",
    message: "Movie entry saved.",
  };
}
