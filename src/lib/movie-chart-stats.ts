import "server-only";

import { and, asc, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import { movieCredits, movies, people } from "@/db/schema";
import {
  getMovieLedgerForUser,
  getVisibleWatchEntriesForUser,
} from "@/lib/movies";

export type MonthlyWatchedCount = {
  month: string;
  label: string;
  count: number;
  movies: string[];
};

export type LabelCount = {
  label: string;
  count: number;
  movies: string[];
};

export type MovieChartStats = {
  monthlyWatched: MonthlyWatchedCount[];
  releaseYears: LabelCount[];
  topDirectors: LabelCount[];
  topActors: LabelCount[];
};

type MovieTooltipEntry = {
  movieId: string;
  title: string;
  watchedOn?: string;
};

function getMonthIndex(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return year * 12 + monthNumber - 1;
}

function formatMonthFromIndex(monthIndex: number) {
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex % 12;

  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function getAllWatchedMonths(watchedOnDates: Iterable<string>) {
  const monthIndexes = Array.from(
    new Set(
      Array.from(watchedOnDates, (watchedOn) =>
        getMonthIndex(watchedOn.slice(0, 7)),
      ),
    ),
  );

  if (monthIndexes.length === 0) {
    return [];
  }

  const firstMonth = Math.min(...monthIndexes);
  const lastMonth = Math.max(...monthIndexes);
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
  });

  return Array.from({ length: lastMonth - firstMonth + 1 }, (_, index) => {
    const monthIndex = firstMonth + index;
    const month = formatMonthFromIndex(monthIndex);
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(year, monthNumber - 1, 1);

    return {
      month,
      label: formatter.format(date),
      count: 0,
      movies: [],
    };
  });
}

function sortMoviesByRanking(
  movies: Iterable<MovieTooltipEntry>,
  rankByMovieId: Map<string, number>,
) {
  return Array.from(movies)
    .sort((left, right) => {
      const leftRank = rankByMovieId.get(left.movieId) ?? Number.MAX_SAFE_INTEGER;
      const rightRank =
        rankByMovieId.get(right.movieId) ?? Number.MAX_SAFE_INTEGER;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      const titleSort = left.title.localeCompare(right.title, "en");

      if (titleSort !== 0) {
        return titleSort;
      }

      return left.movieId.localeCompare(right.movieId, "en");
    })
    .map((movie) => movie.title);
}

function sortMoviesByWatchedOn(movies: Iterable<MovieTooltipEntry>) {
  return Array.from(movies)
    .sort((left, right) => {
      const leftWatchedOn = left.watchedOn ?? "";
      const rightWatchedOn = right.watchedOn ?? "";

      if (leftWatchedOn !== rightWatchedOn) {
        return leftWatchedOn.localeCompare(rightWatchedOn);
      }

      const titleSort = left.title.localeCompare(right.title, "en");

      if (titleSort !== 0) {
        return titleSort;
      }

      return left.movieId.localeCompare(right.movieId, "en");
    })
    .map((movie) => movie.title);
}

function toTopMovieCounts(
  movieIdsByLabel: Map<string, Set<string>>,
  movieTitleById: Map<string, string>,
  rankByMovieId: Map<string, number>,
  limit = 10,
) {
  return Array.from(movieIdsByLabel.entries())
    .map(([label, movieIds]) => ({
      label,
      count: movieIds.size,
      movies: sortMoviesByRanking(
        Array.from(movieIds)
          .map((movieId) => {
            const title = movieTitleById.get(movieId);

            return title ? { movieId, title } : null;
          })
          .filter((movie): movie is MovieTooltipEntry => movie != null),
        rankByMovieId,
      ),
    }))
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label, "en");
    })
    .slice(0, limit);
}

function addMovieForLabel(
  movieIdsByLabel: Map<string, Set<string>>,
  label: string,
  movieId: string,
) {
  const movieIds = movieIdsByLabel.get(label) ?? new Set<string>();
  movieIds.add(movieId);
  movieIdsByLabel.set(label, movieIds);
}

async function getTopDirectors(
  movieIds: string[],
  movieTitleById: Map<string, string>,
  rankByMovieId: Map<string, number>,
) {
  if (movieIds.length === 0) {
    return [];
  }

  const directorCredits = await db
    .select({
      movieId: movieCredits.movieId,
      name: people.name,
    })
    .from(movieCredits)
    .innerJoin(people, eq(movieCredits.personId, people.id))
    .where(
      and(
        inArray(movieCredits.movieId, movieIds),
        eq(movieCredits.creditType, "crew"),
        eq(movieCredits.job, "Director"),
      ),
    );

  const creditedMovieIds = new Set<string>();
  const movieIdsByDirector = new Map<string, Set<string>>();
  const directorsByMovieId = new Map<string, Set<string>>();

  for (const credit of directorCredits) {
    creditedMovieIds.add(credit.movieId);

    const movieDirectors =
      directorsByMovieId.get(credit.movieId) ?? new Set<string>();
    movieDirectors.add(credit.name);
    directorsByMovieId.set(credit.movieId, movieDirectors);
  }

  const missingCreditMovieIds = movieIds.filter(
    (movieId) => !creditedMovieIds.has(movieId),
  );

  const fallbackDirectors =
    missingCreditMovieIds.length > 0
      ? await db
          .select({
            movieId: movies.id,
            director: movies.director,
          })
          .from(movies)
          .where(inArray(movies.id, missingCreditMovieIds))
      : [];

  for (const [movieId, movieDirectors] of directorsByMovieId) {
    for (const director of movieDirectors) {
      addMovieForLabel(movieIdsByDirector, director, movieId);
    }
  }

  for (const movie of fallbackDirectors) {
    if (!movie.director) {
      continue;
    }

    for (const director of movie.director.split(",").map((name) => name.trim())) {
      if (director) {
        addMovieForLabel(movieIdsByDirector, director, movie.movieId);
      }
    }
  }

  return toTopMovieCounts(movieIdsByDirector, movieTitleById, rankByMovieId);
}

async function getTopActors(
  movieIds: string[],
  movieTitleById: Map<string, string>,
  rankByMovieId: Map<string, number>,
) {
  if (movieIds.length === 0) {
    return [];
  }

  const castCredits = await db
    .select({
      movieId: movieCredits.movieId,
      name: people.name,
    })
    .from(movieCredits)
    .innerJoin(people, eq(movieCredits.personId, people.id))
    .where(
      and(
        inArray(movieCredits.movieId, movieIds),
        eq(movieCredits.creditType, "cast"),
        lte(movieCredits.creditOrder, 9),
      ),
    )
    .orderBy(asc(movieCredits.creditOrder));

  const actorsByMovieId = new Map<string, Set<string>>();
  const movieIdsByActor = new Map<string, Set<string>>();

  for (const credit of castCredits) {
    const movieActors = actorsByMovieId.get(credit.movieId) ?? new Set<string>();
    movieActors.add(credit.name);
    actorsByMovieId.set(credit.movieId, movieActors);
  }

  for (const [movieId, movieActors] of actorsByMovieId) {
    for (const actor of movieActors) {
      addMovieForLabel(movieIdsByActor, actor, movieId);
    }
  }

  return toTopMovieCounts(movieIdsByActor, movieTitleById, rankByMovieId);
}

export async function getMovieChartStatsForUser(
  userId: string,
): Promise<MovieChartStats> {
  const visibleEntries = await getVisibleWatchEntriesForUser(userId);
  const rankedLedger = await getMovieLedgerForUser(userId);
  const rankByMovieId = new Map(
    rankedLedger.map((entry) => [entry.movieId, entry.rank]),
  );
  const monthlyWatched = getAllWatchedMonths(
    visibleEntries.map((entry) => entry.watchedOn),
  );
  const moviesByMonth = new Map<string, MovieTooltipEntry[]>(
    monthlyWatched.map((month) => [month.month, []]),
  );
  const movieIdsByReleaseYear = new Map<string, Set<string>>();

  for (const entry of visibleEntries) {
    const month = entry.watchedOn.slice(0, 7);
    const monthMovies = moviesByMonth.get(month);

    if (monthMovies) {
      monthMovies.push({
        movieId: entry.movieId,
        title: entry.movie.title,
        watchedOn: entry.watchedOn,
      });
    }

    if (entry.movie.releaseYear != null) {
      addMovieForLabel(
        movieIdsByReleaseYear,
        String(entry.movie.releaseYear),
        entry.movieId,
      );
    }
  }

  const visibleMovieIds = Array.from(
    new Set(visibleEntries.map((entry) => entry.movieId)),
  );
  const movieTitleById = new Map(
    visibleEntries.map((entry) => [entry.movieId, entry.movie.title]),
  );
  const [topDirectors, topActors] = await Promise.all([
    getTopDirectors(visibleMovieIds, movieTitleById, rankByMovieId),
    getTopActors(visibleMovieIds, movieTitleById, rankByMovieId),
  ]);

  return {
    monthlyWatched: monthlyWatched.map((month) => {
      const movies = sortMoviesByWatchedOn(moviesByMonth.get(month.month) ?? []);

      return {
        ...month,
        count: movies.length,
        movies,
      };
    }),
    releaseYears: Array.from(movieIdsByReleaseYear.entries())
      .map(([label, movieIds]) => ({
        label,
        count: movieIds.size,
        movies: sortMoviesByRanking(
          Array.from(movieIds)
            .map((movieId) => {
              const title = movieTitleById.get(movieId);

              return title ? { movieId, title } : null;
            })
            .filter((movie): movie is MovieTooltipEntry => movie != null),
          rankByMovieId,
        ),
      }))
      .sort((left, right) => Number(left.label) - Number(right.label)),
    topDirectors,
    topActors,
  };
}
