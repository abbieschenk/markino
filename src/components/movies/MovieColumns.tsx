"use client";

import Link from "next/link";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DeleteMovieButton } from "@/components/movies/DeleteMovieButton";
import { cn } from "@/lib/utils";
import type { MovieLedgerEntry } from "@/lib/movies";

const watchedWithFilter: FilterFn<MovieLedgerEntry> = (
  row,
  columnId,
  filterValue,
) => {
  if (!filterValue || filterValue === "all") {
    return true;
  }

  const people = row.getValue<string[]>(columnId);
  return people.includes(filterValue);
};

export const movieColumns: ColumnDef<MovieLedgerEntry>[] = [
  {
    accessorKey: "rank",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 px-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        #
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("rank")}</span>
    ),
    sortingFn: "basic",
    enableColumnFilter: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 px-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue<MovieLedgerEntry["status"]>("status");

      return (
        <Link
          href={`/movies/${row.original.id}`}
          className={cn(
            "hover:underline",
            status !== "watched" ? "font-light italic" : "font-medium",
          )}
        >
          {row.getValue("title")}
        </Link>
      );
    },
  },
  {
    accessorKey: "watchedOn",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 px-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Watched
        <ArrowUpDown className="size-3" />
      </Button>
    ),
  },
  {
    accessorKey: "language",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 px-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Language
        <ArrowUpDown className="size-3" />
      </Button>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 px-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue<MovieLedgerEntry["status"]>("status");

      return (
        <span className="inline-flex min-w-12 justify-center border px-1.5 py-0.5 text-[11px] uppercase tracking-[0.18em] border-[var(--border)]">
          {status}
        </span>
      );
    },
    filterFn: "equals",
  },
  {
    accessorKey: "watchedWith",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 px-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        With
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const watchedWith = row.getValue<string[]>("watchedWith");
      return (
        <span className="text-muted-foreground">{watchedWith.join(", ")}</span>
      );
    },
    filterFn: watchedWithFilter,
    sortingFn: (left, right, columnId) => {
      const leftValue = left.getValue<string[]>(columnId).join(", ");
      const rightValue = right.getValue<string[]>(columnId).join(", ");
      return leftValue.localeCompare(rightValue, "en");
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DeleteMovieButton
          title={row.original.title}
          watchEntryId={row.original.watchEntryId}
        />
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
];
