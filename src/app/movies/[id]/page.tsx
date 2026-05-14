import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovieById } from "@/lib/movies";

type MovieDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: MovieDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = getMovieById(id);

  return {
    title: movie ? movie.title : "Movie",
  };
}

export default async function MovieDetailPage({
  params,
}: MovieDetailPageProps) {
  const { id } = await params;
  const movie = getMovieById(id);

  if (!movie) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/movies"
          className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Movies
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-medium tracking-[-0.04em]">
            {movie.title}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Placeholder detail page for a future watch history, notes, and
            ranking timeline.
          </p>
        </div>
      </div>
      <dl className="grid border border-[var(--border)] text-sm sm:grid-cols-2">
        <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3 sm:border-r">
          <dt className="text-[var(--muted-foreground)]">Preference</dt>
          <dd>{movie.rank}</dd>
        </div>
        <div className="grid grid-cols-[9rem_1fr] border-b border-[var(--border)] px-4 py-3">
          <dt className="text-[var(--muted-foreground)]">Watched on</dt>
          <dd>{movie.watchedOn}</dd>
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
      <section className="border border-[var(--border)]">
        <div className="border-b border-[var(--border)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          Watched With
        </div>
        <div className="px-4 py-3 text-sm">
          {movie.watchedWith.length > 0 ? movie.watchedWith.join(", ") : "Solo"}
        </div>
      </section>
    </section>
  );
}
