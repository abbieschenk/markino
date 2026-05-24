import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { movieRankings, watchEntryParticipants, watchEntries } from "@/db/schema";

export type WatchStatus = "watched" | "dnf" | "dns";

export type MovieLedgerEntry = {
  id: string;
  movieId: string;
  watchEntryId: string;
  rank: number;
  title: string;
  watchedOn: string;
  language: string;
  status: WatchStatus;
  watchedWith: string[];
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
    rank,
    title: entry.movie.title,
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

async function getVisibleWatchEntriesForUser(userId: string) {
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
  return entries.find((entry) => entry.id === movieId) ?? null;
}
