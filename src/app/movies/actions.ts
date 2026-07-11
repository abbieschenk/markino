"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  movieCredits,
  movieRankings,
  movieProductionCountries,
  movieSpokenLanguages,
  movieStudios,
  movies,
  people,
  productionCountries,
  spokenLanguages,
  studios,
  users,
  watchEntries,
  watchEntryParticipants,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getVisibleMovieIdsForUser } from "@/lib/movies";
import {
  getTmdbMovieDetails,
  searchTmdbMovies,
  TmdbClientError,
  type TmdbMovieDetails,
  type TmdbMovieMatch,
} from "@/lib/tmdb";

const VALID_STATUSES = new Set(["watched", "dnf", "dns"] as const);
type WatchStatusValue = "watched" | "dnf" | "dns";
type MovieActionResult = {
  status: "error" | "success";
  message: string | null;
};
type TmdbSearchResult =
  | { status: "success"; message: null; matches: TmdbMovieMatch[] }
  | { status: "error"; message: string; matches: [] };

function parseWatchStatus(value: string): WatchStatusValue | null {
  if (!VALID_STATUSES.has(value as WatchStatusValue)) {
    return null;
  }

  return value as WatchStatusValue;
}

async function requireSuperadmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      status: "error" as const,
      message: "You must be signed in to sync movie metadata.",
      userId: null,
    };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true,
      role: true,
    },
  });

  if (user?.role !== "superadmin") {
    return {
      status: "error" as const,
      message: "Only superadmins can sync movie metadata.",
      userId: session.user.id,
    };
  }

  return {
    status: "success" as const,
    message: null,
    userId: session.user.id,
  };
}

function mapTmdbError(error: unknown, fallbackMessage: string) {
  if (error instanceof TmdbClientError) {
    return error.userMessage;
  }

  console.error(fallbackMessage, error);
  return fallbackMessage;
}

function joinNames(names: string[]) {
  return Array.from(new Set(names)).join(", ") || null;
}

function deriveCreditSummaries(credits: TmdbMovieDetails["credits"]) {
  const writerJobs = new Set(["Writer", "Screenplay", "Story", "Author"]);

  return {
    director: joinNames(
      credits.crew
        .filter((credit) => credit.job === "Director")
        .map((credit) => credit.name),
    ),
    writer: joinNames(
      credits.crew
        .filter((credit) => credit.job && writerJobs.has(credit.job))
        .map((credit) => credit.name),
    ),
    editor: joinNames(
      credits.crew
        .filter((credit) => credit.job === "Editor")
        .map((credit) => credit.name),
    ),
  };
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

export async function searchTmdbMovieMatches(
  movieId: string,
): Promise<TmdbSearchResult> {
  const authorized = await requireSuperadmin();

  if (authorized.status === "error") {
    return {
      status: "error",
      message: authorized.message,
      matches: [],
    };
  }

  const movie = await db.query.movies.findFirst({
    where: eq(movies.id, movieId),
    columns: {
      id: true,
      title: true,
    },
  });

  if (!movie) {
    return {
      status: "error",
      message: "Movie could not be found.",
      matches: [],
    };
  }

  try {
    const matches = await searchTmdbMovies(movie.title);

    return {
      status: "success",
      message: null,
      matches,
    };
  } catch (error) {
    return {
      status: "error",
      message: mapTmdbError(error, "Unable to search TMDB."),
      matches: [],
    };
  }
}

export async function syncMovieMetadata(
  movieId: string,
  tmdbId: number,
): Promise<MovieActionResult> {
  const authorized = await requireSuperadmin();

  if (authorized.status === "error") {
    return {
      status: "error",
      message: authorized.message,
    };
  }

  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return {
      status: "error",
      message: "TMDB movie ID is invalid.",
    };
  }

  try {
    const details = await getTmdbMovieDetails(tmdbId);
    const creditSummaries = deriveCreditSummaries(details.credits);

    await db.transaction(async (tx) => {
      const movie = await tx.query.movies.findFirst({
        where: eq(movies.id, movieId),
        columns: {
          id: true,
        },
      });

      if (!movie) {
        throw new Error("MOVIE_NOT_FOUND");
      }

      await tx
        .delete(movieCredits)
        .where(eq(movieCredits.movieId, movieId));
      await tx
        .delete(movieProductionCountries)
        .where(eq(movieProductionCountries.movieId, movieId));
      await tx
        .delete(movieSpokenLanguages)
        .where(eq(movieSpokenLanguages.movieId, movieId));
      await tx.delete(movieStudios).where(eq(movieStudios.movieId, movieId));

      await tx
        .update(movies)
        .set({
          releaseYear: details.releaseYear,
          originalLanguage: details.originalLanguage,
          tmdbId: details.id,
          tagline: details.tagline,
          director: creditSummaries.director,
          writer: creditSummaries.writer,
          editor: creditSummaries.editor,
          metadataSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(movies.id, movieId));

      if (details.productionCountries.length > 0) {
        await tx
          .insert(productionCountries)
          .values(details.productionCountries)
          .onConflictDoUpdate({
            target: productionCountries.isoCode,
            set: {
              name: sql`excluded.name`,
            },
          });
        await tx.insert(movieProductionCountries).values(
          details.productionCountries.map((country) => ({
            movieId,
            countryCode: country.isoCode,
          })),
        );
      }

      if (details.spokenLanguages.length > 0) {
        await tx
          .insert(spokenLanguages)
          .values(details.spokenLanguages)
          .onConflictDoUpdate({
            target: spokenLanguages.isoCode,
            set: {
              name: sql`excluded.name`,
            },
          });
        await tx.insert(movieSpokenLanguages).values(
          details.spokenLanguages.map((language) => ({
            movieId,
            languageCode: language.isoCode,
          })),
        );
      }

      let studioIdsByTmdbId = new Map<number, string>();

      if (details.studios.length > 0) {
        const syncedStudios = await tx
          .insert(studios)
          .values(details.studios)
          .onConflictDoUpdate({
            target: studios.tmdbCompanyId,
            set: {
              name: sql`excluded.name`,
              originCountry: sql`excluded.origin_country`,
            },
          })
          .returning({
            id: studios.id,
            tmdbCompanyId: studios.tmdbCompanyId,
          });

        studioIdsByTmdbId = new Map(
          syncedStudios.map((studio) => [studio.tmdbCompanyId, studio.id]),
        );

        await tx.insert(movieStudios).values(
          details.studios
            .map((studio) => {
              const studioId = studioIdsByTmdbId.get(studio.tmdbCompanyId);

              return studioId ? { movieId, studioId } : null;
            })
            .filter((studio): studio is { movieId: string; studioId: string } =>
              Boolean(studio),
            ),
        );
      }

      const peopleByTmdbId = new Map<
        number,
        { tmdbPersonId: number; name: string }
      >();

      for (const credit of details.credits.cast) {
        peopleByTmdbId.set(credit.tmdbPersonId, {
          tmdbPersonId: credit.tmdbPersonId,
          name: credit.name,
        });
      }

      for (const credit of details.credits.crew) {
        peopleByTmdbId.set(credit.tmdbPersonId, {
          tmdbPersonId: credit.tmdbPersonId,
          name: credit.name,
        });
      }

      if (peopleByTmdbId.size > 0) {
        const syncedPeople = await tx
          .insert(people)
          .values(Array.from(peopleByTmdbId.values()))
          .onConflictDoUpdate({
            target: people.tmdbPersonId,
            set: {
              name: sql`excluded.name`,
            },
          })
          .returning({
            id: people.id,
            tmdbPersonId: people.tmdbPersonId,
          });
        const personIdsByTmdbId = new Map(
          syncedPeople.map((person) => [person.tmdbPersonId, person.id]),
        );
        const castCreditRows = details.credits.cast
          .map((credit) => {
            const personId = personIdsByTmdbId.get(credit.tmdbPersonId);

            return personId
              ? {
                  movieId,
                  personId,
                  creditType: "cast" as const,
                  department: null,
                  job: null,
                  character: credit.character,
                  creditOrder: credit.order,
                }
              : null;
          })
          .filter((credit): credit is NonNullable<typeof credit> =>
            Boolean(credit),
          );
        const crewCreditRows = details.credits.crew
          .map((credit) => {
            const personId = personIdsByTmdbId.get(credit.tmdbPersonId);

            return personId
              ? {
                  movieId,
                  personId,
                  creditType: "crew" as const,
                  department: credit.department,
                  job: credit.job,
                  character: null,
                  creditOrder: null,
                }
              : null;
          })
          .filter((credit): credit is NonNullable<typeof credit> =>
            Boolean(credit),
          );
        const creditRows = [...castCreditRows, ...crewCreditRows];

        if (creditRows.length > 0) {
          await tx.insert(movieCredits).values(creditRows);
        }
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MOVIE_NOT_FOUND") {
      return {
        status: "error",
        message: "Movie could not be found.",
      };
    }

    return {
      status: "error",
      message: mapTmdbError(error, "Unable to sync movie metadata."),
    };
  }

  revalidatePath("/movies");
  revalidatePath(`/movies/${movieId}`);
  revalidatePath("/");

  return {
    status: "success",
    message: "Movie metadata synced.",
  };
}
