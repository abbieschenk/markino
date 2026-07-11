"use client";

import { useMemo, type ReactNode } from "react";

import { createMovieColumns } from "@/components/movies/MovieColumns";
import { MovieDataTable } from "@/components/movies/MovieDataTable";
import type { MovieLedgerEntry } from "@/lib/movies";

type MovieLedgerProps = {
  data: MovieLedgerEntry[];
  canSyncMetadata?: boolean;
  toolbarActions?: ReactNode;
};

export function MovieLedger({
  data,
  canSyncMetadata = false,
  toolbarActions,
}: MovieLedgerProps) {
  const columns = useMemo(
    () => createMovieColumns({ canSyncMetadata }),
    [canSyncMetadata],
  );

  return (
    <MovieDataTable
      columns={columns}
      data={data}
      toolbarActions={toolbarActions}
    />
  );
}
