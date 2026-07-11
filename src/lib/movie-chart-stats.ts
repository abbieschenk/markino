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
  topDirectors: LabelCount[];
  topActors: LabelCount[];
};

type MovieTooltipEntry = {
  movieId: string;
  title: string;
};

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLastTwelveMonths() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
  });

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);

    return {
      month: formatMonthKey(date),
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
  const monthlyWatched = getLastTwelveMonths();
  const moviesByMonth = new Map<string, MovieTooltipEntry[]>(
    monthlyWatched.map((month) => [month.month, []]),
  );

  for (const entry of visibleEntries) {
    const month = entry.watchedOn.slice(0, 7);
    const monthMovies = moviesByMonth.get(month);

    if (monthMovies) {
      monthMovies.push({
        movieId: entry.movieId,
        title: entry.movie.title,
      });
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
      const movies = sortMoviesByRanking(
        moviesByMonth.get(month.month) ?? [],
        rankByMovieId,
      );

      return {
        ...month,
        count: movies.length,
        movies,
      };
    }),
    topDirectors,
    topActors,
  };
}
