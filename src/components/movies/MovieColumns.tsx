"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowsClockwise,
  ArrowsDownUp,
  Check,
} from "@phosphor-icons/react";
import { actions } from "astro:actions";
import { startTransition, useState } from "react";
import { toast } from "sonner";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import type { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DeleteMovieButton } from "@/components/movies/DeleteMovieButton";
import {
  EditableMovieEntryCellButton,
  EditableWatchedWithCellButton,
  type EditableMovieEntryField,
  type MovieEntryEditTarget,
} from "@/components/movies/editable-movie-entry-cells";
import { SyncMovieMetadataButton } from "@/components/movies/sync-movie-metadata-button";
import { getActionData } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import type { MovieLedgerEntry } from "@/lib/movies";

const watchedWithFilter: FilterFn<MovieLedgerEntry> = (
  row,
  _columnId,
  filterValue,
) => {
  if (!filterValue || filterValue === "all") {
    return true;
  }

  return row.original.watchEntries.some((entry) =>
    entry.watchedWith.includes(filterValue),
  );
};

const watchStatusFilter: FilterFn<MovieLedgerEntry> = (
  row,
  _columnId,
  filterValue,
) => {
  if (!filterValue || filterValue === "all") {
    return true;
  }

  return row.original.watchEntries.some((entry) => entry.status === filterValue);
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

function compareWatchedDates(left: MovieLedgerEntry, right: MovieLedgerEntry) {
  if (left.watchedYear !== right.watchedYear) {
    return left.watchedYear - right.watchedYear;
  }

  if (left.watchedOn && right.watchedOn && left.watchedOn !== right.watchedOn) {
    return left.watchedOn.localeCompare(right.watchedOn);
  }

  if (left.watchedDatePrecision !== right.watchedDatePrecision) {
    return left.watchedDatePrecision === "day" ? -1 : 1;
  }

  return left.title.localeCompare(right.title, "en");
}

type MovieColumnsOptions = {
  activeEditTarget: MovieEntryEditTarget | null;
  canSyncMetadata: boolean;
  onEdit: (target: MovieEntryEditTarget) => void;
  userId: string;
};

export function createMovieColumns({
  activeEditTarget,
  canSyncMetadata,
  onEdit,
  userId,
}: MovieColumnsOptions): ColumnDef<MovieLedgerEntry>[] {
  function isActiveEditTarget(
    entry: MovieLedgerEntry,
    field: EditableMovieEntryField,
  ) {
    return (
      activeEditTarget?.entry.watchEntryId === entry.watchEntryId &&
      activeEditTarget.field === field
    );
  }

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
        <a
          href={`/movies/${row.original.id}`}
          className={cn(
            "block max-w-[28rem] truncate hover:underline",
            status !== "watched" ? "font-light italic" : "font-medium",
          )}
          title={row.original.title}
        >
          {row.getValue("title")}
        </a>
      );
    },
  },
  {
    id: "watchedOn",
    accessorKey: "watchedDateDisplay",
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
    cell: ({ row }) => (
      <EditableMovieEntryCellButton
        entry={row.original}
        field="watchedOn"
        isActive={isActiveEditTarget(row.original, "watchedOn")}
        onEdit={onEdit}
        value={row.original.watchedDateDisplay}
      />
    ),
    sortingFn: (left, right) =>
      compareWatchedDates(left.original, right.original),
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
    cell: ({ row }) => (
      <EditableMovieEntryCellButton
        entry={row.original}
        field="language"
        isActive={isActiveEditTarget(row.original, "language")}
        onEdit={onEdit}
        value={row.original.language}
      />
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
    filterFn: watchStatusFilter,
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
        <EditableWatchedWithCellButton
          entry={row.original}
          isActive={isActiveEditTarget(row.original, "watchedWith")}
          onEdit={onEdit}
          value={watchedWith}
        />
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
        userId={userId}
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
          userId={userId}
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
  userId,
}: {
  canSyncMetadata: boolean;
  isSynced: boolean;
  movieId: string;
  title: string;
  userId: string;
}) {
  if (isSynced) {
    return canSyncMetadata ? (
      <ResyncMovieMetadataButton
        movieId={movieId}
        title={title}
        userId={userId}
      />
    ) : (
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
          userId={userId}
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

function ResyncMovieMetadataButton({
  movieId,
  title,
  userId,
}: {
  movieId: string;
  title: string;
  userId: string;
}) {
  const [pending, setPending] = useState(false);

  function handleResync() {
    setPending(true);

    startTransition(async () => {
      try {
        const result = await getActionData(
          actions.resyncMovieMetadata({ movieId, userId }),
        );

        if (result.status === "error") {
          toast.error(result.message ?? "Unable to resync movie metadata.");
          return;
        }

        toast.success("Movie metadata resynced.");
        window.location.reload();
      } catch (error) {
        console.error("Failed to resync movie metadata", error);
        toast.error("Unable to resync movie metadata.");
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <div className="flex justify-center">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-[var(--muted-foreground)] hover:bg-transparent hover:text-[var(--foreground)]"
        onClick={handleResync}
        disabled={pending}
        aria-label={`Resync TMDB metadata for ${title}`}
        title={`Resync TMDB metadata for ${title}`}
      >
        {pending ? (
          <ArrowsClockwise
            aria-hidden="true"
            className="animate-spin"
            size={14}
            weight="regular"
          />
        ) : (
          <Check aria-hidden="true" size={14} weight="regular" />
        )}
      </Button>
    </div>
  );
}
