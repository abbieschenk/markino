"use client";

import { AddMovieDialog } from "@/components/movies/AddMovieDialog";
import { MovieLedger } from "@/components/movies/MovieLedger";
import type { MovieLedgerEntry } from "@/lib/movies";

type MoviesScreenIslandProps = {
  canSyncMetadata: boolean;
  data: MovieLedgerEntry[];
  defaultWatchedWith: string[];
  watchedWithOptions: string[];
};

export function MoviesScreenIsland({
  canSyncMetadata,
  data,
  defaultWatchedWith,
  watchedWithOptions,
}: MoviesScreenIslandProps) {
  return (
    <MovieLedger
      data={data}
      canSyncMetadata={canSyncMetadata}
      watchedWithOptions={watchedWithOptions}
      toolbarActions={
        <AddMovieDialog
          canAdd
          defaultWatchedWith={defaultWatchedWith}
          watchedWithOptions={watchedWithOptions}
        />
      }
    />
  );
}
