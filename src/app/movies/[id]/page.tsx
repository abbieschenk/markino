import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { SyncMovieMetadataButton } from "@/components/movies/sync-movie-metadata-button";
import { auth } from "@/lib/auth";
import { getMovieByIdForUser } from "@/lib/movies";

type MovieDetailPageProps = {
  params: Promise<{ id: string }>;
};

function joinValues(values: string[]) {
  return values.length > 0 ? values.join(", ") : "-";
}

function formatSyncedAt(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatRuntime(minutes: number | null) {
  if (!minutes) {
    return "-";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function formatMoney(value: number | null) {
  if (!value) {
    return "-";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTmdbPosterUrl(posterPath: string | null) {
  return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
}

export async function generateMetadata({
  params,
}: MovieDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const movie = session?.user?.id
    ? await getMovieByIdForUser(id, session.user.id)
    : null;

  return {
    title: movie ? movie.title : "Movie",
  };
}

export default async function MovieDetailPage({
  params,
}: MovieDetailPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const movie = session?.user?.id
    ? await getMovieByIdForUser(id, session.user.id)
    : null;

  if (!movie) {
    notFound();
  }

  const canSyncMetadata = session?.user.role === "superadmin";
  const hasCredits =
    Boolean(movie.director) ||
    Boolean(movie.writer) ||
    Boolean(movie.editor) ||
    movie.cast.length > 0;
  const posterUrl = getTmdbPosterUrl(movie.posterPath);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/movies"
          className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Movies
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-medium tracking-[-0.04em]">
              {movie.title}
            </h1>
            {movie.tagline ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {movie.tagline}
              </p>
            ) : null}
          </div>
          {canSyncMetadata ? (
            <SyncMovieMetadataButton movieId={movie.movieId} title={movie.title} />
          ) : null}
        </div>
      </div>
      <dl className="grid border border-[var(--border)] text-sm sm:grid-cols-2">
        <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3 sm:border-r">
          <dt className="text-[var(--muted-foreground)]">Preference</dt>
          <dd>{movie.rank}</dd>
        </div>
        <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
          <dt className="text-[var(--muted-foreground)]">Watched on</dt>
          <dd>{movie.watchedDateDisplay}</dd>
        </div>
        <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3 sm:border-b-0 sm:border-r">
          <dt className="text-[var(--muted-foreground)]">Language</dt>
          <dd>{movie.language}</dd>
        </div>
        <div className="grid grid-cols-[9rem_1fr] px-4 py-3">
          <dt className="text-[var(--muted-foreground)]">Status</dt>
          <dd>{movie.status}</dd>
        </div>
      </dl>
      {movie.isMetadataSynced ? (
        <>
          <section className="border border-[var(--border)]">
            <div className="border-b border-[var(--border)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              TMDB Metadata
            </div>
            <dl className="grid text-sm sm:grid-cols-2">
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3 sm:border-r">
                <dt className="text-[var(--muted-foreground)]">TMDB ID</dt>
                <dd>
                  {movie.tmdbId ? (
                    <a
                      href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {movie.tmdbId}
                    </a>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                <dt className="text-[var(--muted-foreground)]">Release</dt>
                <dd>{movie.releaseDate ?? movie.releaseYear ?? "-"}</dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3 sm:border-r">
                <dt className="text-[var(--muted-foreground)]">Runtime</dt>
                <dd>{formatRuntime(movie.runtimeMinutes)}</dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                <dt className="text-[var(--muted-foreground)]">
                  Original Title
                </dt>
                <dd>{movie.originalTitle ?? "-"}</dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3 sm:border-r">
                <dt className="text-[var(--muted-foreground)]">Original Lang</dt>
                <dd>{movie.originalLanguage ?? "-"}</dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                <dt className="text-[var(--muted-foreground)]">IMDb ID</dt>
                <dd>
                  {movie.imdbId ? (
                    <a
                      href={`https://www.imdb.com/title/${movie.imdbId}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {movie.imdbId}
                    </a>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3 sm:border-r">
                <dt className="text-[var(--muted-foreground)]">Poster</dt>
                <dd>
                  {posterUrl ? (
                    <a
                      href={posterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      View image
                    </a>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                <dt className="text-[var(--muted-foreground)]">Synced</dt>
                <dd>{formatSyncedAt(movie.metadataSyncedAt)}</dd>
              </div>
            </dl>
          </section>
          {movie.overview ? (
            <section className="border border-[var(--border)]">
              <div className="border-b border-[var(--border)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                Overview
              </div>
              <p className="px-4 py-3 text-sm leading-6">{movie.overview}</p>
            </section>
          ) : null}
          <section className="border border-[var(--border)]">
            <div className="border-b border-[var(--border)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Production
            </div>
            <dl className="grid text-sm">
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                <dt className="text-[var(--muted-foreground)]">Genres</dt>
                <dd>{joinValues(movie.genres)}</dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                <dt className="text-[var(--muted-foreground)]">Origin</dt>
                <dd>{joinValues(movie.originCountries)}</dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                <dt className="text-[var(--muted-foreground)]">Countries</dt>
                <dd>{joinValues(movie.productionCountries)}</dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                <dt className="text-[var(--muted-foreground)]">Languages</dt>
                <dd>{joinValues(movie.spokenLanguages)}</dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] px-4 py-3">
                <dt className="text-[var(--muted-foreground)]">Studios</dt>
                <dd>{joinValues(movie.studios)}</dd>
              </div>
            </dl>
          </section>
          <section className="border border-[var(--border)]">
            <div className="border-b border-[var(--border)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Financials
            </div>
            <dl className="grid text-sm sm:grid-cols-2">
              <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3 sm:border-r sm:border-b-0">
                <dt className="text-[var(--muted-foreground)]">Budget</dt>
                <dd>{formatMoney(movie.budget)}</dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] px-4 py-3">
                <dt className="text-[var(--muted-foreground)]">Revenue</dt>
                <dd>{formatMoney(movie.revenue)}</dd>
              </div>
            </dl>
          </section>
          {hasCredits ? (
            <section className="border border-[var(--border)]">
              <div className="border-b border-[var(--border)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                Credits
              </div>
              <dl className="grid text-sm">
                {movie.director ? (
                  <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                    <dt className="text-[var(--muted-foreground)]">Director</dt>
                    <dd>{movie.director}</dd>
                  </div>
                ) : null}
                {movie.writer ? (
                  <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                    <dt className="text-[var(--muted-foreground)]">Writer</dt>
                    <dd>{movie.writer}</dd>
                  </div>
                ) : null}
                {movie.editor ? (
                  <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
                    <dt className="text-[var(--muted-foreground)]">Editor</dt>
                    <dd>{movie.editor}</dd>
                  </div>
                ) : null}
                {movie.cast.length > 0 ? (
                  <div className="grid grid-cols-[9rem_1fr] px-4 py-3">
                    <dt className="text-[var(--muted-foreground)]">Cast</dt>
                    <dd className="grid gap-1">
                      {movie.cast.map((credit) => (
                        <span key={`${credit.name}-${credit.character ?? ""}`}>
                          {credit.name}
                          {credit.character ? (
                            <span className="text-[var(--muted-foreground)]">
                              {" "}
                              as {credit.character}
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}
        </>
      ) : (
        <section className="border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
          TMDB metadata has not been synced.
        </section>
      )}
      <section className="border border-[var(--border)]">
        <div className="border-b border-[var(--border)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          Watched With
        </div>
        <div className="px-4 py-3 text-sm">{movie.watchedWith.join(", ")}</div>
      </section>
    </section>
  );
}
