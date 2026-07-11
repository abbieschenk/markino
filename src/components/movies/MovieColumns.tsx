"use client";

import { ArrowDown, ArrowUp, ArrowsDownUp, Check } from "@phosphor-icons/react";
import Link from "next/link";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import type { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DeleteMovieButton } from "@/components/movies/DeleteMovieButton";
import { SyncMovieMetadataButton } from "@/components/movies/sync-movie-metadata-button";
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

function SortIcon({ column }: { column: Column<MovieLedgerEntry> }) {
  const sorted = column.getIsSorted();

  if (sorted === "asc") {
    return <ArrowUp className="size-3" weight="regular" />;
  }

  if (sorted === "desc") {
    return <ArrowDown className="size-3" weight="regular" />;
  }

  return <ArrowsDownUp className="size-3" weight="regular" />;
}

function getSortButtonClassName(column: Column<MovieLedgerEntry>) {
  return cn(
    "-ml-2 h-7 px-2 text-[11px] uppercase tracking-[0.18em] hover:bg-transparent hover:text-foreground",
    column.getIsSorted() ? "font-semibold text-foreground" : "text-muted-foreground",
  );
}

type MovieColumnsOptions = {
  canSyncMetadata: boolean;
};

export function createMovieColumns({
  canSyncMetadata,
}: MovieColumnsOptions): ColumnDef<MovieLedgerEntry>[] {
  return [
  {
    accessorKey: "rank",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className={getSortButtonClassName(column)}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        #
        <SortIcon column={column} />
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
        className={getSortButtonClassName(column)}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <SortIcon column={column} />
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
        className={getSortButtonClassName(column)}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Watched
        <SortIcon column={column} />
      </Button>
    ),
  },
  {
    accessorKey: "language",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className={getSortButtonClassName(column)}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Language
        <SortIcon column={column} />
      </Button>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className={getSortButtonClassName(column)}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <SortIcon column={column} />
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
        className={getSortButtonClassName(column)}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        With
        <SortIcon column={column} />
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
    accessorKey: "isMetadataSynced",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className={getSortButtonClassName(column)}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Synced
        <SortIcon column={column} />
      </Button>
    ),
    cell: ({ row }) => (
      <SyncedCell
        canSyncMetadata={canSyncMetadata}
        isSynced={row.getValue<boolean>("isMetadataSynced")}
        movieId={row.original.movieId}
        title={row.original.title}
      />
    ),
    sortingFn: "basic",
    enableColumnFilter: false,
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
}

function SyncedCell({
  canSyncMetadata,
  isSynced,
  movieId,
  title,
}: {
  canSyncMetadata: boolean;
  isSynced: boolean;
  movieId: string;
  title: string;
}) {
  if (isSynced) {
    return (
      <span
        className="flex justify-center text-[var(--muted-foreground)]"
        title="Synced"
      >
        <Check aria-hidden="true" size={14} weight="regular" />
        <span className="sr-only">Synced</span>
      </span>
    );
  }

  if (canSyncMetadata) {
    return (
      <div className="flex justify-center">
        <SyncMovieMetadataButton
          display="icon"
          movieId={movieId}
          title={title}
        />
      </div>
    );
  }

  return (
    <span className="flex justify-center text-[var(--muted-foreground)]">
      -
    </span>
  );
}
