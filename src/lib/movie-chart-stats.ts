import { and, asc, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  genres,
  movieCredits,
  movieGenres,
  movieRankings,
  movies,
  people,
  watchEntryParticipants,
  watchEntries,
} from "@/db/schema";

export type MonthlyWatchedCount = {
  month: string;
  label: string;
  count: number;
  movies: string[];
};

export type YearlyWatchedCount = {
  year: string;
  label: string;
  count: number;
  movies: string[];
};

export type LabelCount = {
  label: string;
  count: number;
  movies: string[];
};

export type WatchedByMonthCount = {
  month: string;
  label: string;
  moviesByYear: Record<string, string[]>;
} & Record<string, string | number | Record<string, string[]>>;

export type GenreOverTimeCount = {
  month: string;
  label: string;
  moviesByGenre: Record<string, string[]>;
} & Record<string, string | number | Record<string, string[]>>;

export type MovieMoneyOverTimeCount = {
  period: string;
  label: string;
  budget: number;
  revenue: number;
  movieCount: number;
  movies: string[];
};

export type MovieChartStats = {
  monthlyWatched: MonthlyWatchedCount[];
  yearlyWatched: YearlyWatchedCount[];
  monthlyMoneyOverTime: MovieMoneyOverTimeCount[];
  yearlyMoneyOverTime: MovieMoneyOverTimeCount[];
  watchedByMonth: WatchedByMonthCount[];
  yearOnlyWatchedOmittedFromMonthly: number;
  releaseYears: LabelCount[];
  watchedLanguages: LabelCount[];
  topGenres: LabelCount[];
  monthlyGenreOverTime: GenreOverTimeCount[];
  yearlyGenreOverTime: GenreOverTimeCount[];
  topDirectors: LabelCount[];
  topActors: LabelCount[];
};

type MovieTooltipEntry = {
  movieId: string;
  title: string;
  watchedOn?: string;
  watchedYear?: number;
  watchedDatePrecision?: "day" | "year";
};

type ChartWatchEntry = {
  id: string;
  movieId: string;
  watchedOn: string;
  watchedDatePrecision: "day" | "year";
  languageWatched: string;
  movie: {
    title: string;
    releaseYear: number | null;
    budget: number | null;
    revenue: number | null;
  };
};

async function getOwnedChartWatchEntries(userId: string) {
  return db.query.watchEntries.findMany({
    where: eq(watchEntries.userId, userId),
    columns: {
      id: true,
      movieId: true,
      watchedOn: true,
      watchedDatePrecision: true,
      languageWatched: true,
    },
    with: {
      movie: {
        columns: {
          title: true,
          releaseYear: true,
          budget: true,
          revenue: true,
        },
      },
    },
  });
}

async function getParticipantChartWatchEntries(userId: string) {
  return db.query.watchEntryParticipants.findMany({
    where: eq(watchEntryParticipants.userId, userId),
    columns: {
      watchEntryId: true,
    },
    with: {
      watchEntry: {
        columns: {
          id: true,
          movieId: true,
          watchedOn: true,
          watchedDatePrecision: true,
          languageWatched: true,
        },
        with: {
          movie: {
            columns: {
              title: true,
              releaseYear: true,
              budget: true,
              revenue: true,
            },
          },
        },
      },
    },
  });
}

async function getVisibleChartWatchEntriesForUser(
  userId: string,
): Promise<ChartWatchEntry[]> {
  const ownedEntries = await getOwnedChartWatchEntries(userId);
  const participantLinks = await getParticipantChartWatchEntries(userId);
  const entriesById = new Map<string, ChartWatchEntry>();

  for (const entry of ownedEntries) {
    entriesById.set(entry.id, entry);
  }

  for (const participantLink of participantLinks) {
    entriesById.set(
      participantLink.watchEntry.id,
      participantLink.watchEntry,
    );
  }

  return Array.from(entriesById.values());
}

async function getRankByMovieId(userId: string, movieIds: string[]) {
  if (movieIds.length === 0) {
    return new Map<string, number>();
  }

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

  return new Map(rankings.map((ranking) => [ranking.movieId, ranking.rank]));
}

function compareChartWatchEntriesNewestFirst(
  left: ChartWatchEntry,
  right: ChartWatchEntry,
) {
  const leftWatchedYear = getWatchedYear(left.watchedOn);
  const rightWatchedYear = getWatchedYear(right.watchedOn);

  if (leftWatchedYear !== rightWatchedYear) {
    return rightWatchedYear - leftWatchedYear;
  }

  if (
    left.watchedDatePrecision === "day" &&
    right.watchedDatePrecision === "day" &&
    left.watchedOn !== right.watchedOn
  ) {
    return right.watchedOn.localeCompare(left.watchedOn);
  }

  if (left.watchedDatePrecision !== right.watchedDatePrecision) {
    return left.watchedDatePrecision === "day" ? -1 : 1;
  }

  return right.id.localeCompare(left.id, "en");
}

function selectChartEntriesByMovie(entries: ChartWatchEntry[]) {
  const entriesByMovieId = new Map<string, ChartWatchEntry>();

  for (const entry of entries) {
    const currentEntry = entriesByMovieId.get(entry.movieId);

    if (
      !currentEntry ||
      compareChartWatchEntriesNewestFirst(entry, currentEntry) < 0
    ) {
      entriesByMovieId.set(entry.movieId, entry);
    }
  }

  return Array.from(entriesByMovieId.values());
}

async function getChartRankByMovieId(userId: string, entries: ChartWatchEntry[]) {
  const summaryEntries = selectChartEntriesByMovie(entries);
  const persistedRankByMovieId = await getRankByMovieId(
    userId,
    summaryEntries.map((entry) => entry.movieId),
  );
  const sortedEntries = [...summaryEntries].sort((left, right) => {
    const leftRank = persistedRankByMovieId.get(left.movieId);
    const rightRank = persistedRankByMovieId.get(right.movieId);

    if (leftRank != null && rightRank != null && leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (leftRank != null) {
      return -1;
    }

    if (rightRank != null) {
      return 1;
    }

    const watchedDateSort = compareChartWatchEntriesNewestFirst(left, right);

    if (watchedDateSort !== 0) {
      return watchedDateSort;
    }

    return left.movie.title.localeCompare(right.movie.title, "en");
  });

  return new Map(
    sortedEntries.map((entry, index) => [entry.movieId, index + 1]),
  );
}

function getWatchedYear(watchedOn: string) {
  return Number(watchedOn.slice(0, 4));
}

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

function getAllWatchedYears(watchedYears: Iterable<number>) {
  const years = Array.from(new Set(watchedYears));

  if (years.length === 0) {
    return [];
  }

  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);

  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
    const year = String(firstYear + index).padStart(4, "0");

    return {
      year,
      label: year,
      count: 0,
      movies: [],
    };
  });
}

function getWatchedByMonth(
  entries: ChartWatchEntry[],
) {
  const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });
  const exactDateEntries = entries.filter(
    (entry) => entry.watchedDatePrecision === "day" && entry.watchedOn,
  );
  const watchedYears = Array.from(
    new Set(exactDateEntries.map((entry) => entry.watchedOn.slice(0, 4))),
  ).sort((left, right) => left.localeCompare(right));
  const moviesByMonthAndYear = new Map<string, Map<string, MovieTooltipEntry[]>>(
    Array.from({ length: 12 }, (_, index) => [
      String(index + 1).padStart(2, "0"),
      new Map(watchedYears.map((year) => [year, []])),
    ]),
  );

  for (const entry of exactDateEntries) {
    const year = entry.watchedOn.slice(0, 4);
    const month = entry.watchedOn.slice(5, 7);
    const moviesByYear = moviesByMonthAndYear.get(month);
    const movies = moviesByYear?.get(year);

    if (!movies) {
      continue;
    }

    movies.push({
      movieId: entry.movieId,
      title: entry.movie.title,
      watchedOn: entry.watchedOn,
      watchedYear: getWatchedYear(entry.watchedOn),
      watchedDatePrecision: entry.watchedDatePrecision,
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    const date = new Date(2000, index, 1);
    const moviesByYear = moviesByMonthAndYear.get(month) ?? new Map();
    const item: WatchedByMonthCount = {
      month,
      label: monthFormatter.format(date),
      moviesByYear: {},
    };

    for (const year of watchedYears) {
      const movies = sortMoviesByWatchedOn(moviesByYear.get(year) ?? []);
      item[year] = movies.length;
      item.moviesByYear[year] = movies;
    }

    return item;
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
      const leftWatchedYear = left.watchedYear ?? 0;
      const rightWatchedYear = right.watchedYear ?? 0;

      if (leftWatchedYear !== rightWatchedYear) {
        return leftWatchedYear - rightWatchedYear;
      }

      const leftWatchedOn = left.watchedOn ?? "";
      const rightWatchedOn = right.watchedOn ?? "";

      if (leftWatchedOn !== rightWatchedOn) {
        return leftWatchedOn.localeCompare(rightWatchedOn);
      }

      if (
        left.watchedDatePrecision &&
        right.watchedDatePrecision &&
        left.watchedDatePrecision !== right.watchedDatePrecision
      ) {
        return left.watchedDatePrecision === "day" ? -1 : 1;
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

  return toTopMovieCounts(movieIdsByDirector, movieTitleById, rankByMovieId, 20);
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

  return toTopMovieCounts(movieIdsByActor, movieTitleById, rankByMovieId, 20);
}

async function getGenreStats(
  visibleEntries: ChartWatchEntry[],
  monthlyWatched: MonthlyWatchedCount[],
  yearlyWatched: YearlyWatchedCount[],
  movieTitleById: Map<string, string>,
  rankByMovieId: Map<string, number>,
) {
  const visibleMovieIds = Array.from(
    new Set(visibleEntries.map((entry) => entry.movieId)),
  );

  if (visibleMovieIds.length === 0) {
    return {
      topGenres: [],
      monthlyGenreOverTime: [],
      yearlyGenreOverTime: [],
    };
  }

  const rows = await db
    .select({
      movieId: movieGenres.movieId,
      genre: genres.name,
    })
    .from(movieGenres)
    .innerJoin(genres, eq(movieGenres.genreId, genres.id))
    .where(inArray(movieGenres.movieId, visibleMovieIds));

  const genresByMovieId = new Map<string, Set<string>>();
  const movieIdsByGenre = new Map<string, Set<string>>();

  for (const row of rows) {
    const movieGenresForMovie =
      genresByMovieId.get(row.movieId) ?? new Set<string>();
    movieGenresForMovie.add(row.genre);
    genresByMovieId.set(row.movieId, movieGenresForMovie);
    addMovieForLabel(movieIdsByGenre, row.genre, row.movieId);
  }

  const topGenres = toTopMovieCounts(
    movieIdsByGenre,
    movieTitleById,
    rankByMovieId,
  );
  const timelineGenres = topGenres.slice(0, 10).map((genre) => genre.label);
  const timelineGenreSet = new Set(timelineGenres);

  return {
    topGenres,
    monthlyGenreOverTime: buildGenreOverTime({
      buckets: monthlyWatched.map((month) => ({
        key: month.month,
        label: month.label,
      })),
      entries: visibleEntries.filter(
        (entry) => entry.watchedDatePrecision === "day" && entry.watchedOn,
      ),
      genresByMovieId,
      timelineGenres,
      timelineGenreSet,
      getBucketKey: (entry) => entry.watchedOn?.slice(0, 7) ?? null,
    }),
    yearlyGenreOverTime: buildGenreOverTime({
      buckets: yearlyWatched.map((year) => ({
        key: year.year,
        label: year.label,
      })),
      entries: visibleEntries,
      genresByMovieId,
      timelineGenres,
      timelineGenreSet,
      getBucketKey: (entry) => entry.watchedOn.slice(0, 4),
    }),
  };
}

function buildGenreOverTime({
  buckets,
  entries,
  genresByMovieId,
  timelineGenres,
  timelineGenreSet,
  getBucketKey,
}: {
  buckets: { key: string; label: string }[];
  entries: ChartWatchEntry[];
  genresByMovieId: Map<string, Set<string>>;
  timelineGenres: string[];
  timelineGenreSet: Set<string>;
  getBucketKey: (
    entry: ChartWatchEntry,
  ) => string | null;
}) {
  const moviesByBucketAndGenre = new Map<
    string,
    Map<string, MovieTooltipEntry[]>
  >(buckets.map((bucket) => [bucket.key, new Map()]));

  for (const entry of entries) {
    const entryGenres = genresByMovieId.get(entry.movieId);

    if (!entryGenres) {
      continue;
    }

    const bucketKey = getBucketKey(entry);
    const moviesByGenre = bucketKey
      ? moviesByBucketAndGenre.get(bucketKey)
      : null;

    if (!moviesByGenre) {
      continue;
    }

    for (const genre of entryGenres) {
      if (!timelineGenreSet.has(genre)) {
        continue;
      }

      const movies = moviesByGenre.get(genre) ?? [];
      movies.push({
        movieId: entry.movieId,
        title: entry.movie.title,
        watchedOn: entry.watchedOn,
        watchedYear: getWatchedYear(entry.watchedOn),
        watchedDatePrecision: entry.watchedDatePrecision,
      });
      moviesByGenre.set(genre, movies);
    }
  }

  return buckets.map((bucket) => {
    const moviesByGenre = moviesByBucketAndGenre.get(bucket.key) ?? new Map();
    const item: GenreOverTimeCount = {
      month: bucket.key,
      label: bucket.label,
      moviesByGenre: {},
    };

    for (const genre of timelineGenres) {
      const movies = sortMoviesByWatchedOn(moviesByGenre.get(genre) ?? []);
      item[genre] = movies.length;
      item.moviesByGenre[genre] = movies;
    }

    return item;
  });
}

function buildMovieMoneyOverTime({
  buckets,
  entries,
  getBucketKey,
}: {
  buckets: { key: string; label: string }[];
  entries: ChartWatchEntry[];
  getBucketKey: (
    entry: ChartWatchEntry,
  ) => string | null;
}) {
  const entriesByBucket = new Map<string, ChartWatchEntry[]>(
    buckets.map((bucket) => [bucket.key, []]),
  );

  for (const entry of entries) {
    const bucketKey = getBucketKey(entry);
    const bucketEntries = bucketKey ? entriesByBucket.get(bucketKey) : null;

    if (!bucketEntries) {
      continue;
    }

    bucketEntries.push(entry);
  }

  return buckets.map((bucket) => {
    const bucketEntries = entriesByBucket.get(bucket.key) ?? [];
    const moneyEntries = bucketEntries.filter(
      (entry) =>
        (entry.movie.budget != null && entry.movie.budget > 0) ||
        (entry.movie.revenue != null && entry.movie.revenue > 0),
    );

    return {
      period: bucket.key,
      label: bucket.label,
      budget: moneyEntries.reduce(
        (total, entry) => total + Math.max(entry.movie.budget ?? 0, 0),
        0,
      ),
      revenue: moneyEntries.reduce(
        (total, entry) => total + Math.max(entry.movie.revenue ?? 0, 0),
        0,
      ),
      movieCount: moneyEntries.length,
      movies: sortMoviesByWatchedOn(
        moneyEntries.map((entry) => ({
          movieId: entry.movieId,
          title: entry.movie.title,
          watchedOn: entry.watchedOn,
          watchedYear: getWatchedYear(entry.watchedOn),
          watchedDatePrecision: entry.watchedDatePrecision,
        })),
      ),
    };
  });
}

export async function getMovieChartStatsForUser(
  userId: string,
): Promise<MovieChartStats> {
  const visibleEntries = await getVisibleChartWatchEntriesForUser(userId);
  const visibleMovieIds = Array.from(
    new Set(visibleEntries.map((entry) => entry.movieId)),
  );
  const rankByMovieId = await getChartRankByMovieId(userId, visibleEntries);
  const exactDateEntries = visibleEntries.filter(
    (entry) => entry.watchedDatePrecision === "day",
  );
  const monthlyWatched = getAllWatchedMonths(
    exactDateEntries.map((entry) => entry.watchedOn),
  );
  const yearlyWatched = getAllWatchedYears(
    visibleEntries.map((entry) => getWatchedYear(entry.watchedOn)),
  );
  const moviesByMonth = new Map<string, MovieTooltipEntry[]>(
    monthlyWatched.map((month) => [month.month, []]),
  );
  const moviesByYear = new Map<string, MovieTooltipEntry[]>(
    yearlyWatched.map((year) => [year.year, []]),
  );
  const movieIdsByReleaseYear = new Map<string, Set<string>>();
  const entriesByLanguage = new Map<string, MovieTooltipEntry[]>();

  for (const entry of visibleEntries) {
    const language = entry.languageWatched.trim() || "Unknown";
    const languageEntries = entriesByLanguage.get(language) ?? [];
    languageEntries.push({
      movieId: entry.movieId,
      title: entry.movie.title,
      watchedOn: entry.watchedOn,
      watchedYear: getWatchedYear(entry.watchedOn),
      watchedDatePrecision: entry.watchedDatePrecision,
    });
    entriesByLanguage.set(language, languageEntries);

    if (entry.watchedDatePrecision === "day") {
      const month = entry.watchedOn.slice(0, 7);
      const monthMovies = moviesByMonth.get(month);

      if (monthMovies) {
        monthMovies.push({
          movieId: entry.movieId,
          title: entry.movie.title,
          watchedOn: entry.watchedOn,
          watchedYear: getWatchedYear(entry.watchedOn),
          watchedDatePrecision: entry.watchedDatePrecision,
        });
      }
    }

    const yearMovies = moviesByYear.get(
      entry.watchedOn.slice(0, 4),
    );

    if (yearMovies) {
      yearMovies.push({
        movieId: entry.movieId,
        title: entry.movie.title,
        watchedOn: entry.watchedOn,
        watchedYear: getWatchedYear(entry.watchedOn),
        watchedDatePrecision: entry.watchedDatePrecision,
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

  const movieTitleById = new Map(
    visibleEntries.map((entry) => [entry.movieId, entry.movie.title]),
  );
  const [
    { topGenres, monthlyGenreOverTime, yearlyGenreOverTime },
    topDirectors,
    topActors,
  ] = await Promise.all([
      getGenreStats(
        visibleEntries,
        monthlyWatched,
        yearlyWatched,
        movieTitleById,
        rankByMovieId,
      ),
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
    yearlyWatched: yearlyWatched.map((year) => {
      const movies = sortMoviesByWatchedOn(moviesByYear.get(year.year) ?? []);

      return {
        ...year,
        count: movies.length,
        movies,
      };
    }),
    monthlyMoneyOverTime: buildMovieMoneyOverTime({
      buckets: monthlyWatched.map((month) => ({
        key: month.month,
        label: month.label,
      })),
      entries: exactDateEntries,
      getBucketKey: (entry) => entry.watchedOn.slice(0, 7),
    }),
    yearlyMoneyOverTime: buildMovieMoneyOverTime({
      buckets: yearlyWatched.map((year) => ({
        key: year.year,
        label: year.label,
      })),
      entries: visibleEntries,
      getBucketKey: (entry) => entry.watchedOn.slice(0, 4),
    }),
    watchedByMonth: getWatchedByMonth(visibleEntries),
    yearOnlyWatchedOmittedFromMonthly: visibleEntries.filter(
      (entry) => entry.watchedDatePrecision === "year",
    ).length,
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
    watchedLanguages: Array.from(entriesByLanguage.entries())
      .map(([label, entries]) => ({
        label,
        count: entries.length,
        movies: sortMoviesByWatchedOn(entries),
      }))
      .sort((left, right) =>
        right.count !== left.count
          ? right.count - left.count
          : left.label.localeCompare(right.label, "en"),
      ),
    topGenres,
    monthlyGenreOverTime,
    yearlyGenreOverTime,
    topDirectors,
    topActors,
  };
}
