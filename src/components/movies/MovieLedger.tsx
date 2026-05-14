"use client";

import { movieColumns } from "@/components/movies/MovieColumns";
import { MovieDataTable } from "@/components/movies/MovieDataTable";
import type { MovieLedgerEntry } from "@/lib/movies";

type MovieLedgerProps = {
  data: MovieLedgerEntry[];
};

export function MovieLedger({ data }: MovieLedgerProps) {
  return <MovieDataTable columns={movieColumns} data={data} />;
}
