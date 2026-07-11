import "server-only";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type TmdbMovieMatch = {
  tmdbId: number;
  title: string;
  originalTitle: string;
  releaseDate: string | null;
  releaseYear: number | null;
  originalLanguage: string;
  overview: string;
};

export type TmdbMovieDetails = {
  id: number;
  title: string;
  originalTitle: string;
  overview: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  runtimeMinutes: number | null;
  originalLanguage: string | null;
  originCountries: string[];
  imdbId: string | null;
  posterPath: string | null;
  tagline: string | null;
  budget: number | null;
  revenue: number | null;
  genres: {
    tmdbGenreId: number;
    name: string;
  }[];
  productionCountries: {
    isoCode: string;
    name: string;
  }[];
  spokenLanguages: {
    isoCode: string;
    name: string;
  }[];
  studios: {
    tmdbCompanyId: number;
    name: string;
    originCountry: string | null;
  }[];
  credits: {
    cast: TmdbCastCredit[];
    crew: TmdbCrewCredit[];
  };
};

export type TmdbCastCredit = {
  tmdbPersonId: number;
  name: string;
  character: string | null;
  order: number | null;
};

export type TmdbCrewCredit = {
  tmdbPersonId: number;
  name: string;
  department: string | null;
  job: string | null;
};

type TmdbSearchResponse = {
  results?: {
    id?: number;
    title?: string;
    original_title?: string;
    release_date?: string;
    original_language?: string;
    overview?: string;
  }[];
};

type TmdbDetailsResponse = {
  id?: number;
  title?: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  runtime?: number;
  original_language?: string;
  origin_country?: string[];
  imdb_id?: string;
  poster_path?: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  genres?: {
    id?: number;
    name?: string;
  }[];
  production_countries?: {
    iso_3166_1?: string;
    name?: string;
  }[];
  spoken_languages?: {
    iso_639_1?: string;
    english_name?: string;
    name?: string;
  }[];
  production_companies?: {
    id?: number;
    name?: string;
    origin_country?: string;
  }[];
  credits?: {
    cast?: {
      id?: number;
      name?: string;
      character?: string;
      order?: number;
    }[];
    crew?: {
      id?: number;
      name?: string;
      department?: string;
      job?: string;
    }[];
  };
};

export class TmdbClientError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
  ) {
    super(message);
    this.name = "TmdbClientError";
  }
}

function getAccessToken() {
  const token = process.env.TMDB_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new TmdbClientError(
      "TMDB_ACCESS_TOKEN is not set.",
      "TMDB is not configured. Add TMDB_ACCESS_TOKEN and try again.",
    );
  }

  return token;
}

function getReleaseYear(releaseDate: string | null) {
  if (!releaseDate) {
    return null;
  }

  const year = Number(releaseDate.slice(0, 4));
  return Number.isInteger(year) ? year : null;
}

function textOrNull(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function positiveIntegerOrNull(value: number | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

async function tmdbFetch<T>(path: string, params?: URLSearchParams): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  if (params) {
    url.search = params.toString();
  }

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new TmdbClientError(
      `TMDB request failed: ${String(error)}`,
      "Unable to reach TMDB. Try again in a moment.",
    );
  }

  if (response.status === 429) {
    throw new TmdbClientError(
      "TMDB rate limit exceeded.",
      "TMDB is rate limiting requests. Try again in a moment.",
    );
  }

  if (!response.ok) {
    throw new TmdbClientError(
      `TMDB request failed with ${response.status}.`,
      "TMDB returned an error. Try again in a moment.",
    );
  }

  return (await response.json()) as T;
}

export async function searchTmdbMovies(
  query: string,
): Promise<TmdbMovieMatch[]> {
  const params = new URLSearchParams({
    query,
    include_adult: "false",
  });
  const data = await tmdbFetch<TmdbSearchResponse>("/search/movie", params);

  return (data.results ?? [])
    .filter((movie) => typeof movie.id === "number" && movie.title)
    .map((movie) => {
      const releaseDate = textOrNull(movie.release_date);

      return {
        tmdbId: movie.id!,
        title: movie.title!,
        originalTitle: movie.original_title ?? movie.title!,
        releaseDate,
        releaseYear: getReleaseYear(releaseDate),
        originalLanguage: movie.original_language ?? "",
        overview: movie.overview ?? "",
      };
    });
}

export async function getTmdbMovieDetails(
  tmdbId: number,
): Promise<TmdbMovieDetails> {
  const params = new URLSearchParams({
    append_to_response: "credits",
  });
  const data = await tmdbFetch<TmdbDetailsResponse>(`/movie/${tmdbId}`, params);

  if (typeof data.id !== "number" || !data.title) {
    throw new TmdbClientError(
      `TMDB movie ${tmdbId} returned an invalid response.`,
      "TMDB returned incomplete movie data. Try another match.",
    );
  }

  const releaseDate = textOrNull(data.release_date);

  return {
    id: data.id,
    title: data.title,
    originalTitle: data.original_title ?? data.title,
    overview: textOrNull(data.overview),
    releaseDate,
    releaseYear: getReleaseYear(releaseDate),
    runtimeMinutes: positiveIntegerOrNull(data.runtime),
    originalLanguage: textOrNull(data.original_language),
    originCountries: Array.from(
      new Set(
        (data.origin_country ?? [])
          .map((country) => country.trim().toUpperCase())
          .filter(Boolean),
      ),
    ),
    imdbId: textOrNull(data.imdb_id),
    posterPath: textOrNull(data.poster_path),
    tagline: textOrNull(data.tagline),
    budget: positiveIntegerOrNull(data.budget),
    revenue: positiveIntegerOrNull(data.revenue),
    genres: (data.genres ?? [])
      .filter((genre) => typeof genre.id === "number" && genre.name)
      .map((genre) => ({
        tmdbGenreId: genre.id!,
        name: genre.name!,
      })),
    productionCountries: (data.production_countries ?? [])
      .filter((country) => country.iso_3166_1 && country.name)
      .map((country) => ({
        isoCode: country.iso_3166_1!,
        name: country.name!,
      })),
    spokenLanguages: (data.spoken_languages ?? [])
      .filter((language) => language.iso_639_1 && (language.english_name || language.name))
      .map((language) => ({
        isoCode: language.iso_639_1!,
        name: language.english_name || language.name!,
      })),
    studios: (data.production_companies ?? [])
      .filter((company) => typeof company.id === "number" && company.name)
      .map((company) => ({
        tmdbCompanyId: company.id!,
        name: company.name!,
        originCountry: textOrNull(company.origin_country),
      })),
    credits: {
      cast: (data.credits?.cast ?? [])
        .filter((credit) => typeof credit.id === "number" && credit.name)
        .map((credit) => ({
          tmdbPersonId: credit.id!,
          name: credit.name!,
          character: textOrNull(credit.character),
          order: typeof credit.order === "number" ? credit.order : null,
        })),
      crew: (data.credits?.crew ?? [])
        .filter((credit) => typeof credit.id === "number" && credit.name)
        .map((credit) => ({
          tmdbPersonId: credit.id!,
          name: credit.name!,
          department: textOrNull(credit.department),
          job: textOrNull(credit.job),
        })),
    },
  };
}
