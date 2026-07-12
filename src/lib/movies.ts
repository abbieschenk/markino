import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  movieRankings,
  movies,
  watchEntryParticipants,
  watchEntries,
} from "@/db/schema";

export type WatchStatus = "watched" | "dnf" | "dns";

export type MovieLedgerEntry = {
  id: string;
  movieId: string;
  watchEntryId: string;
  canEdit: boolean;
  rank: number;
  title: string;
  isMetadataSynced: boolean;
  watchedOn: string;
  language: string;
  status: WatchStatus;
  watchedWith: string[];
};

export type MovieDetail = MovieLedgerEntry & {
  releaseYear: number | null;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  originalTitle: string | null;
  overview: string | null;
  originalLanguage: string | null;
  originCountries: string[];
  tmdbId: number | null;
  imdbId: string | null;
  posterPath: string | null;
  tagline: string | null;
  budget: number | null;
  revenue: number | null;
  director: string | null;
  writer: string | null;
  editor: string | null;
  metadataSyncedAt: Date | null;
  genres: string[];
  productionCountries: string[];
  spokenLanguages: string[];
  studios: string[];
  cast: {
    name: string;
    character: string | null;
  }[];
};

async function getOwnedWatchEntries(userId: string) {
  return db.query.watchEntries.findMany({
    where: eq(watchEntries.userId, userId),
    with: {
      movie: true,
      user: {
        columns: {
          id: true,
          handle: true,
        },
      },
      participants: {
        with: {
          user: {
            columns: {
              id: true,
              handle: true,
            },
          },
        },
      },
    },
  });
}

async function getParticipantWatchEntries(userId: string) {
  return db.query.watchEntryParticipants.findMany({
    where: eq(watchEntryParticipants.userId, userId),
    with: {
      watchEntry: {
        with: {
          movie: true,
          user: {
            columns: {
              id: true,
              handle: true,
            },
          },
          participants: {
            with: {
              user: {
                columns: {
                  id: true,
                  handle: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

type HydratedWatchEntry = Awaited<ReturnType<typeof getOwnedWatchEntries>>[number];

function sortLedgerEntries(left: MovieLedgerEntry, right: MovieLedgerEntry) {
  if (left.rank !== right.rank) {
    return left.rank - right.rank;
  }

  if (left.watchedOn !== right.watchedOn) {
    return right.watchedOn.localeCompare(left.watchedOn);
  }

  return left.title.localeCompare(right.title, "en");
}

function mapWatchedWithHandles(entry: HydratedWatchEntry, userId: string) {
  const handles = new Set<string>();

  if (entry.userId !== userId) {
    handles.add(entry.user.handle);
  }

  for (const participant of entry.participants) {
    if (participant.userId !== userId) {
      handles.add(participant.user.handle);
    }
  }

  return Array.from(handles).sort((left, right) => left.localeCompare(right, "en"));
}

function mapLedgerEntry(
  entry: HydratedWatchEntry,
  userId: string,
  rank: number,
): MovieLedgerEntry {
  return {
    id: entry.movieId,
    movieId: entry.movieId,
    watchEntryId: entry.id,
    canEdit: entry.userId === userId,
    rank,
    title: entry.movie.title,
    isMetadataSynced: entry.movie.tmdbId != null,
    watchedOn: entry.watchedOn,
    language: entry.languageWatched,
    status: entry.status,
    watchedWith: mapWatchedWithHandles(entry, userId),
  };
}

function selectLedgerEntriesByMovie(entries: HydratedWatchEntry[]) {
  const entriesByMovieId = new Map<string, HydratedWatchEntry>();

  for (const entry of entries) {
    const currentEntry = entriesByMovieId.get(entry.movieId);

    if (!currentEntry || entry.watchedOn > currentEntry.watchedOn) {
      entriesByMovieId.set(entry.movieId, entry);
    }
  }

  return Array.from(entriesByMovieId.values());
}

export async function getVisibleWatchEntriesForUser(userId: string) {
  const ownedEntries = await getOwnedWatchEntries(userId);
  const participantLinks = await getParticipantWatchEntries(userId);

  const entriesById = new Map<string, HydratedWatchEntry>();

  for (const entry of ownedEntries) {
    entriesById.set(entry.id, entry);
  }

  for (const participantLink of participantLinks) {
    entriesById.set(participantLink.watchEntry.id, participantLink.watchEntry);
  }

  return Array.from(entriesById.values());
}

export async function getVisibleMovieIdsForUser(
  userId: string,
): Promise<string[]> {
  const visibleEntries = await getVisibleWatchEntriesForUser(userId);
  return selectLedgerEntriesByMovie(visibleEntries).map((entry) => entry.movieId);
}

export async function getMovieLedgerForUser(
  userId: string,
): Promise<MovieLedgerEntry[]> {
  const visibleEntries = selectLedgerEntriesByMovie(
    await getVisibleWatchEntriesForUser(userId),
  );

  if (visibleEntries.length === 0) {
    return [];
  }

  const movieIds = Array.from(
    new Set(visibleEntries.map((entry) => entry.movieId)),
  );
  const rankings = await db.query.movieRankings.findMany({
    where: and(
      eq(movieRankings.userId, userId),
      inArray(movieRankings.movieId, movieIds),
    ),
    columns: {
      movieId: true,
      rank: true,
    },
  });

  const rankByMovieId = new Map(
    rankings.map((ranking) => [ranking.movieId, ranking.rank]),
  );
  const sortedEntries = [...visibleEntries].sort((left, right) => {
    const leftRank = rankByMovieId.get(left.movieId);
    const rightRank = rankByMovieId.get(right.movieId);

    if (leftRank != null && rightRank != null && leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (leftRank != null) {
      return -1;
    }

    if (rightRank != null) {
      return 1;
    }

    if (left.watchedOn !== right.watchedOn) {
      return right.watchedOn.localeCompare(left.watchedOn);
    }

    return left.movie.title.localeCompare(right.movie.title, "en");
  });

  return sortedEntries
    .map((entry, index) => mapLedgerEntry(entry, userId, index + 1))
    .sort(sortLedgerEntries);
}

export async function getMovieByIdForUser(movieId: string, userId: string) {
  const entries = await getMovieLedgerForUser(userId);
  const entry = entries.find((ledgerEntry) => ledgerEntry.id === movieId);

  if (!entry) {
    return null;
  }

  const movie = await db.query.movies.findFirst({
    where: eq(movies.id, movieId),
    with: {
      genres: {
        with: {
          genre: true,
        },
      },
      productionCountries: {
        with: {
          country: true,
        },
      },
      spokenLanguages: {
        with: {
          language: true,
        },
      },
      studios: {
        with: {
          studio: true,
        },
      },
      credits: {
        with: {
          person: true,
        },
      },
    },
  });

  if (!movie) {
    return null;
  }

  return {
    ...entry,
    releaseYear: movie.releaseYear,
    releaseDate: movie.releaseDate,
    runtimeMinutes: movie.runtimeMinutes,
    originalTitle: movie.originalTitle,
    overview: movie.overview,
    originalLanguage: movie.originalLanguage,
    originCountries: movie.originCountries ?? [],
    tmdbId: movie.tmdbId,
    imdbId: movie.imdbId,
    posterPath: movie.posterPath,
    tagline: movie.tagline,
    budget: movie.budget,
    revenue: movie.revenue,
    director: movie.director,
    writer: movie.writer,
    editor: movie.editor,
    metadataSyncedAt: movie.metadataSyncedAt,
    genres: movie.genres
      .map((genre) => genre.genre.name)
      .sort((left, right) => left.localeCompare(right, "en")),
    productionCountries: movie.productionCountries
      .map((country) => country.country.name)
      .sort((left, right) => left.localeCompare(right, "en")),
    spokenLanguages: movie.spokenLanguages
      .map((language) => language.language.name)
      .sort((left, right) => left.localeCompare(right, "en")),
    studios: movie.studios
      .map((studio) => studio.studio.name)
      .sort((left, right) => left.localeCompare(right, "en")),
    cast: movie.credits
      .filter((credit) => credit.creditType === "cast")
      .sort(
        (left, right) =>
          (left.creditOrder ?? 9999) - (right.creditOrder ?? 9999),
      )
      .slice(0, 16)
      .map((credit) => ({
        name: credit.person.name,
        character: credit.character,
      })),
  } satisfies MovieDetail;
}
