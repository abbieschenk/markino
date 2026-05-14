"use client";

import { movieColumns } from "@/components/movies/movie-columns";
import { MovieDataTable } from "@/components/movies/movie-data-table";
import type { MovieLedgerEntry } from "@/lib/movies";

type MovieLedgerProps = {
  data: MovieLedgerEntry[];
};

export function MovieLedger({ data }: MovieLedgerProps) {
  return <MovieDataTable columns={movieColumns} data={data} />;
}
