import { asc, ne } from "drizzle-orm";

import { AddMovieDialog } from "@/components/movies/AddMovieDialog";
import { MovieLedger } from "@/components/movies/MovieLedger";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getMovieLedgerForUser } from "@/lib/movies";

type MoviesScreenProps = {
  userId: string;
};

export async function MoviesScreen({ userId }: MoviesScreenProps) {
  const movieLedger = await getMovieLedgerForUser(userId);
  const watchedWithOptions = await db
    .select({ handle: users.handle })
    .from(users)
    .where(ne(users.id, userId))
    .orderBy(asc(users.handle));

  return (
    <section className="space-y-6">
      <header className="flex justify-end">
        <div className="flex items-center gap-3">
          <div className="text-xs text-[var(--muted-foreground)]">
            {movieLedger.length} entries
          </div>
          <AddMovieDialog
            canAdd
            watchedWithOptions={watchedWithOptions.map((user) => user.handle)}
          />
        </div>
      </header>
      <MovieLedger data={movieLedger} />
    </section>
  );
}
