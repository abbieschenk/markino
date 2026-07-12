"use client";

import { useMemo, useState, type ReactNode } from "react";

import { createMovieColumns } from "@/components/movies/MovieColumns";
import {
  MovieEntryEditPanel,
  type MovieEntryEditTarget,
} from "@/components/movies/editable-movie-entry-cells";
import { MovieDataTable } from "@/components/movies/MovieDataTable";
import type { MovieLedgerEntry } from "@/lib/movies";

type MovieLedgerProps = {
  data: MovieLedgerEntry[];
  canSyncMetadata?: boolean;
  watchedWithOptions: string[];
  toolbarActions?: ReactNode;
};

export function MovieLedger({
  data,
  canSyncMetadata = false,
  watchedWithOptions,
  toolbarActions,
}: MovieLedgerProps) {
  const [editTarget, setEditTarget] = useState<MovieEntryEditTarget | null>(
    null,
  );
  const columns = useMemo(
    () =>
      createMovieColumns({
        activeEditTarget: editTarget,
        canSyncMetadata,
        onEdit: setEditTarget,
      }),
    [canSyncMetadata, editTarget],
  );

  return (
    <>
      <MovieDataTable
        columns={columns}
        data={data}
        toolbarActions={toolbarActions}
      />
      {editTarget ? (
        <MovieEntryEditPanel
          key={`${editTarget.entry.watchEntryId}:${editTarget.field}`}
          target={editTarget}
          watchedWithOptions={watchedWithOptions}
          onCancel={() => setEditTarget(null)}
        />
      ) : null}
    </>
  );
}
