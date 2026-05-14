import type { Metadata } from "next";
import { MovieLedger } from "@/components/movies/movie-ledger";
import { movieLedger } from "@/lib/movies";

export const metadata: Metadata = {
  title: "Movies",
};

export default function MoviesPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          Ledger
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-medium tracking-[-0.03em]">
              Movies
            </h1>
            <p className="max-w-3xl text-sm text-[var(--muted-foreground)]">
              Mock ranking table with compact controls and fake watch data.
            </p>
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {movieLedger.length} entries
          </div>
        </div>
      </header>
      <MovieLedger data={movieLedger} />
    </section>
  );
}
