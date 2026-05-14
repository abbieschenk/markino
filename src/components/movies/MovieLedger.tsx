"use client";

import type { ReactNode } from "react";

import { movieColumns } from "@/components/movies/MovieColumns";
import { MovieDataTable } from "@/components/movies/MovieDataTable";
import type { MovieLedgerEntry } from "@/lib/movies";

type MovieLedgerProps = {
  data: MovieLedgerEntry[];
  toolbarActions?: ReactNode;
};

export function MovieLedger({ data, toolbarActions }: MovieLedgerProps) {
  return (
    <MovieDataTable
      columns={movieColumns}
      data={data}
      toolbarActions={toolbarActions}
    />
  );
}
