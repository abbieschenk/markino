"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  genres,
  movieCredits,
  movieGenres,
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
type UpdateMovieEntryInput = {
  watchEntryId: string;
  watchedOn: string;
  languageWatched: string;
  watchedWithHandles: string[];
};
type MovieEntryInput = {
  title: string;
  watchedOn: string;
  languageWatched: string;
  rawStatus: string;
  watchedWithHandles: string[];
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

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

function getUniqueHandles(values: FormDataEntryValue[]) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function parseUpdateMovieEntryInput(
  input: UpdateMovieEntryInput,
): UpdateMovieEntryInput {
  return {
    watchEntryId: input.watchEntryId.trim(),
    watchedOn: input.watchedOn.trim(),
    languageWatched: input.languageWatched.trim() || "English",
    watchedWithHandles: Array.from(
      new Set(
        input.watchedWithHandles
          .map((handle) => handle.trim().toLowerCase())
          .filter(Boolean),
      ),
    ),
  };
}

function parseMovieEntryInputs(formData: FormData): MovieEntryInput[] {
  const rowIds = formData
    .getAll("movieRowId")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (rowIds.length === 0) {
    return [
      {
        title: String(formData.get("title") ?? "").trim(),
        watchedOn: String(formData.get("watchedOn") ?? "").trim(),
        languageWatched:
          String(formData.get("languageWatched") ?? "").trim() || "English",
        rawStatus: String(formData.get("status") ?? "watched")
          .trim()
          .toLowerCase(),
        watchedWithHandles: getUniqueHandles(formData.getAll("watchedWith")),
      },
    ];
  }

  return Array.from(new Set(rowIds)).map((rowId) => ({
    title: String(formData.get(`title:${rowId}`) ?? "").trim(),
    watchedOn: String(formData.get(`watchedOn:${rowId}`) ?? "").trim(),
    languageWatched:
      String(formData.get(`languageWatched:${rowId}`) ?? "").trim() ||
      "English",
    rawStatus: String(formData.get(`status:${rowId}`) ?? "watched")
      .trim()
      .toLowerCase(),
    watchedWithHandles: getUniqueHandles(formData.getAll(`watchedWith:${rowId}`)),
  }));
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

  const entries = parseMovieEntryInputs(formData);

  if (entries.length === 0) {
    return {
      status: "error",
      message: "Add at least one movie.",
    };
  }

  const missingTitleIndex = entries.findIndex((entry) => !entry.title);
  if (missingTitleIndex >= 0) {
    return {
      status: "error",
      message:
        entries.length === 1
          ? "Title is required."
          : `Row ${missingTitleIndex + 1}: title is required.`,
    };
  }

  const missingWatchedOnIndex = entries.findIndex((entry) => !entry.watchedOn);
  if (missingWatchedOnIndex >= 0) {
    return {
      status: "error",
      message:
        entries.length === 1
          ? "Date watched is required."
          : `Row ${missingWatchedOnIndex + 1}: date watched is required.`,
    };
  }

  const entriesWithStatus = entries.map((entry) => ({
    ...entry,
    status: parseWatchStatus(entry.rawStatus),
  }));
  const invalidStatusIndex = entriesWithStatus.findIndex(
    (entry) => !entry.status,
  );
  if (invalidStatusIndex >= 0) {
    return {
      status: "error",
      message:
        entries.length === 1
          ? "Watch status is invalid."
          : `Row ${invalidStatusIndex + 1}: watch status is invalid.`,
    };
  }

  const participantHandles = Array.from(
    new Set(
      entries.flatMap((entry) =>
        entry.watchedWithHandles.filter(
          (handle) => handle !== session.user.handle,
        ),
      ),
    ),
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
      const movieIdByNormalizedTitle = new Map<string, string>();
      const participantUserByHandle = new Map(
        participantUsers.map((user) => [user.handle, user]),
      );

      for (const entry of entriesWithStatus) {
        if (!entry.status) {
          throw new Error("Unexpected invalid watch status.");
        }

        const normalizedTitle = entry.title.toLocaleLowerCase();
        let movieId = movieIdByNormalizedTitle.get(normalizedTitle);

        if (!movieId) {
          const existingMovie = await tx.query.movies.findFirst({
            where: sql`lower(${movies.title}) = ${normalizedTitle}`,
            columns: {
              id: true,
            },
          });

          movieId =
            existingMovie?.id ??
            (
              await tx
                .insert(movies)
                .values({
                  title: entry.title,
                })
                .returning({ id: movies.id })
            )[0].id;

          movieIdByNormalizedTitle.set(normalizedTitle, movieId);
        }

        const [watchEntry] = await tx
          .insert(watchEntries)
          .values({
            userId: session.user.id,
            movieId,
            watchedOn: entry.watchedOn,
            languageWatched: entry.languageWatched,
            status: entry.status,
          })
          .returning({ id: watchEntries.id });

        const rowParticipantUsers = entry.watchedWithHandles
          .filter((handle) => handle !== session.user.handle)
          .map((handle) => participantUserByHandle.get(handle))
          .filter((user): user is (typeof participantUsers)[number] =>
            Boolean(user),
          );

        if (rowParticipantUsers.length > 0) {
          await tx.insert(watchEntryParticipants).values(
            rowParticipantUsers.map((user) => ({
              watchEntryId: watchEntry.id,
              userId: user.id,
            })),
          );
        }
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
    message:
      entries.length === 1 ? "Movie entry saved." : "Movie entries saved.",
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

export async function updateMovieEntry(
  input: UpdateMovieEntryInput,
): Promise<MovieActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "You must be signed in to edit a movie.",
    };
  }

  const entry = parseUpdateMovieEntryInput(input);

  if (!entry.watchEntryId) {
    return {
      status: "error",
      message: "Movie entry is missing.",
    };
  }

  if (!isValidDateString(entry.watchedOn)) {
    return {
      status: "error",
      message: "Date watched must be a valid date.",
    };
  }

  if (!entry.languageWatched) {
    return {
      status: "error",
      message: "Language is required.",
    };
  }

  const participantHandles = entry.watchedWithHandles.filter(
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
      const watchEntry = await tx.query.watchEntries.findFirst({
        where: eq(watchEntries.id, entry.watchEntryId),
        columns: {
          id: true,
          userId: true,
        },
      });

      if (!watchEntry) {
        throw new Error("WATCH_ENTRY_NOT_FOUND");
      }

      if (watchEntry.userId !== session.user.id) {
        throw new Error("WATCH_ENTRY_FORBIDDEN");
      }

      await tx
        .update(watchEntries)
        .set({
          watchedOn: entry.watchedOn,
          languageWatched: entry.languageWatched,
          updatedAt: new Date(),
        })
        .where(eq(watchEntries.id, entry.watchEntryId));

      await tx
        .delete(watchEntryParticipants)
        .where(eq(watchEntryParticipants.watchEntryId, entry.watchEntryId));

      if (participantUsers.length > 0) {
        await tx.insert(watchEntryParticipants).values(
          participantUsers.map((user) => ({
            watchEntryId: entry.watchEntryId,
            userId: user.id,
          })),
        );
      }
    });
  } catch (error) {
    console.error("Failed to update movie entry", error);

    return {
      status: "error",
      message: "Unable to update the movie entry.",
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
      await tx.delete(movieGenres).where(eq(movieGenres.movieId, movieId));
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
          title: details.title,
          originalTitle: details.originalTitle,
          overview: details.overview,
          releaseYear: details.releaseYear,
          releaseDate: details.releaseDate,
          runtimeMinutes: details.runtimeMinutes,
          originalLanguage: details.originalLanguage,
          originCountries: details.originCountries,
          tmdbId: details.id,
          imdbId: details.imdbId,
          posterPath: details.posterPath,
          tagline: details.tagline,
          budget: details.budget,
          revenue: details.revenue,
          director: creditSummaries.director,
          writer: creditSummaries.writer,
          editor: creditSummaries.editor,
          metadataSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(movies.id, movieId));

      if (details.genres.length > 0) {
        const syncedGenres = await tx
          .insert(genres)
          .values(details.genres)
          .onConflictDoUpdate({
            target: genres.tmdbGenreId,
            set: {
              name: sql`excluded.name`,
            },
          })
          .returning({
            id: genres.id,
            tmdbGenreId: genres.tmdbGenreId,
          });
        const genreIdsByTmdbId = new Map(
          syncedGenres.map((genre) => [genre.tmdbGenreId, genre.id]),
        );

        await tx.insert(movieGenres).values(
          details.genres
            .map((genre) => {
              const genreId = genreIdsByTmdbId.get(genre.tmdbGenreId);

              return genreId ? { movieId, genreId } : null;
            })
            .filter((genre): genre is { movieId: string; genreId: string } =>
              Boolean(genre),
            ),
        );
      }

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

export async function resyncMovieMetadata(
  movieId: string,
): Promise<MovieActionResult> {
  const authorized = await requireSuperadmin();

  if (authorized.status === "error") {
    return {
      status: "error",
      message: authorized.message,
    };
  }

  const movie = await db.query.movies.findFirst({
    where: eq(movies.id, movieId),
    columns: {
      tmdbId: true,
    },
  });

  if (!movie) {
    return {
      status: "error",
      message: "Movie could not be found.",
    };
  }

  if (!movie.tmdbId) {
    return {
      status: "error",
      message: "Movie metadata has not been synced yet.",
    };
  }

  return syncMovieMetadata(movieId, movie.tmdbId);
}
