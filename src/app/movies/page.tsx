import type { Metadata } from "next";
import { headers } from "next/headers";
import { asc, ne } from "drizzle-orm";

import { AddMovieDialog } from "@/components/movies/AddMovieDialog";
import { MovieLedger } from "@/components/movies/MovieLedger";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getMovieLedgerForUser } from "@/lib/movies";

export const metadata: Metadata = {
  title: "Movies",
};

export default async function MoviesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const movieLedger = session?.user?.id
    ? await getMovieLedgerForUser(session.user.id)
    : [];
  const watchedWithOptions = session?.user?.id
    ? await db
        .select({ handle: users.handle })
        .from(users)
        .where(ne(users.id, session.user.id))
        .orderBy(asc(users.handle))
    : [];

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
              Watch entries loaded from your ledger, including shared watches.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-[var(--muted-foreground)]">
              {movieLedger.length} entries
            </div>
            <AddMovieDialog
              canAdd={Boolean(session?.user?.id)}
              watchedWithOptions={watchedWithOptions.map((user) => user.handle)}
            />
          </div>
        </div>
      </header>
      <MovieLedger data={movieLedger} />
    </section>
  );
}
