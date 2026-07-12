import { asc, eq, ne } from "drizzle-orm";

import { AddMovieDialog } from "@/components/movies/AddMovieDialog";
import { MovieLedger } from "@/components/movies/MovieLedger";
import { db } from "@/db";
import { userDefaultWatchParticipants, users } from "@/db/schema";
import { getMovieLedgerForUser } from "@/lib/movies";

type MoviesScreenProps = {
  userId: string;
  canSyncMetadata?: boolean;
};

export async function MoviesScreen({
  userId,
  canSyncMetadata = false,
}: MoviesScreenProps) {
  const movieLedger = await getMovieLedgerForUser(userId);
  const [watchedWithOptions, defaultWatchedWith] = await Promise.all([
    db
      .select({ handle: users.handle })
      .from(users)
      .where(ne(users.id, userId))
      .orderBy(asc(users.handle)),
    db
      .select({ handle: users.handle })
      .from(userDefaultWatchParticipants)
      .innerJoin(
        users,
        eq(userDefaultWatchParticipants.participantUserId, users.id),
      )
      .where(eq(userDefaultWatchParticipants.userId, userId))
      .orderBy(asc(users.handle)),
  ]);

  return (
    <MovieLedger
      data={movieLedger}
      canSyncMetadata={canSyncMetadata}
      watchedWithOptions={watchedWithOptions.map((user) => user.handle)}
      toolbarActions={
        <AddMovieDialog
          canAdd
          defaultWatchedWith={defaultWatchedWith.map((user) => user.handle)}
          watchedWithOptions={watchedWithOptions.map((user) => user.handle)}
        />
      }
    />
  );
}
