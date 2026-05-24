"use client";
/* eslint-disable react-hooks/incompatible-library */

import { GripVertical } from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { reorderMovieRankings } from "@/app/movies/actions";
import type { MovieLedgerEntry, WatchStatus } from "@/lib/movies";
import { cn } from "@/lib/utils";

type MovieDataTableProps = {
  columns: ColumnDef<MovieLedgerEntry>[];
  data: MovieLedgerEntry[];
  toolbarActions?: ReactNode;
};

const statusOptions: Array<WatchStatus | "all"> = [
  "all",
  "watched",
  "dnf",
  "dns",
];
const SPLICE_DURATION_MS = 650;

type DropTarget = {
  movieId: string;
  position: "before" | "after";
};

function rankLedgerEntries(entries: MovieLedgerEntry[]) {
  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

function moveMovieInRankOrder(
  entries: MovieLedgerEntry[],
  draggedMovieId: string,
  target: DropTarget,
) {
  if (draggedMovieId === target.movieId) {
    return null;
  }

  const rankOrderedEntries = [...entries].sort((left, right) => {
    if (left.rank !== right.rank) {
      return left.rank - right.rank;
    }

    return left.title.localeCompare(right.title, "en");
  });
  const draggedEntry = rankOrderedEntries.find(
    (entry) => entry.movieId === draggedMovieId,
  );

  if (!draggedEntry) {
    return null;
  }

  const entriesWithoutDragged = rankOrderedEntries.filter(
    (entry) => entry.movieId !== draggedMovieId,
  );
  const targetIndex = entriesWithoutDragged.findIndex(
    (entry) => entry.movieId === target.movieId,
  );

  if (targetIndex === -1) {
    return null;
  }

  const insertIndex =
    target.position === "after" ? targetIndex + 1 : targetIndex;
  entriesWithoutDragged.splice(insertIndex, 0, draggedEntry);

  return rankLedgerEntries(entriesWithoutDragged);
}

export function MovieDataTable({
  columns,
  data,
  toolbarActions,
}: MovieDataTableProps) {
  const [tableData, setTableData] = useState<MovieLedgerEntry[]>(data);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "rank", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [draggedMovieId, setDraggedMovieId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [splicedMovieId, setSplicedMovieId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  useEffect(() => {
    if (!splicedMovieId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSplicedMovieId(null);
    }, SPLICE_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [splicedMovieId]);

  const watchedWithOptions = useMemo(() => {
    const people = new Set<string>();

    for (const movie of tableData) {
      for (const person of movie.watchedWith) {
        people.add(person);
      }
    }

    return [
      "all",
      ...Array.from(people).sort((left, right) => left.localeCompare(right)),
    ];
  }, [tableData]);

  const canReorder =
    sorting.length === 1 &&
    sorting[0]?.id === "rank" &&
    sorting[0].desc === false;
  const canDragReorder = canReorder && !isSavingOrder;
  const shouldFadeHandles = draggedMovieId !== null;

  const table = useReactTable({
    data: tableData,
    columns,
    getRowId: (row) => row.movieId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string) ?? "all";
  const watchedWithFilter =
    (table.getColumn("watchedWith")?.getFilterValue() as string) ?? "all";

  function persistMovieOrder(
    nextData: MovieLedgerEntry[],
    previousData: MovieLedgerEntry[],
  ) {
    setIsSavingOrder(true);
    setOrderError(null);

    startTransition(async () => {
      try {
        const result = await reorderMovieRankings(
          [...nextData]
            .sort((left, right) => left.rank - right.rank)
            .map((entry) => entry.movieId),
        );

        if (result.status === "error") {
          setTableData(previousData);
          setSplicedMovieId(null);
          setOrderError(result.message ?? "Unable to save the movie order.");
        }
      } catch (error) {
        console.error("Failed to persist movie order", error);

        setTableData(previousData);
        setSplicedMovieId(null);
        setOrderError("Unable to save the movie order.");
      } finally {
        setIsSavingOrder(false);
      }
    });
  }

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    movieId: string,
  ) {
    if (!canDragReorder) {
      event.preventDefault();
      return;
    }

    setDraggedMovieId(movieId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", movieId);
  }

  function handleDragOver(
    event: DragEvent<HTMLTableRowElement>,
    movieId: string,
  ) {
    if (!canDragReorder || !draggedMovieId || draggedMovieId === movieId) {
      return;
    }

    event.preventDefault();

    const rowBounds = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY - rowBounds.top > rowBounds.height / 2 ? "after" : "before";

    setDropTarget({ movieId, position });
  }

  function handleDrop(event: DragEvent<HTMLTableRowElement>, movieId: string) {
    event.preventDefault();

    if (!canDragReorder || !draggedMovieId) {
      return;
    }

    const target = dropTarget ?? { movieId, position: "before" };
    const previousData = tableData;
    const nextData = moveMovieInRankOrder(tableData, draggedMovieId, target);

    setDraggedMovieId(null);
    setDropTarget(null);

    if (!nextData) {
      return;
    }

    setTableData(nextData);
    setSplicedMovieId(draggedMovieId);
    persistMovieOrder(nextData, previousData);
  }

  function handleDragEnd() {
    setDraggedMovieId(null);
    setDropTarget(null);
  }

  return (
    <section className="border border-[var(--border)] bg-white/40">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              table
                .getColumn("status")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="h-8 min-w-32 rounded-none border-[var(--border)] bg-[var(--background)] px-2 text-sm shadow-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  Status: {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={watchedWithFilter}
            onValueChange={(value) =>
              table
                .getColumn("watchedWith")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="h-8 min-w-36 rounded-none border-[var(--border)] bg-[var(--background)] px-2 text-sm shadow-none">
              <SelectValue placeholder="Watched with" />
            </SelectTrigger>
            <SelectContent>
              {watchedWithOptions.map((person) => (
                <SelectItem key={person} value={person}>
                  With: {person === "all" ? "anyone" : person}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          {orderError ? (
            <div className="text-xs text-destructive">{orderError}</div>
          ) : null}
          {isSavingOrder ? (
            <div className="text-xs text-muted-foreground">Saving order</div>
          ) : null}
          <div className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {tableData.length} movies
          </div>
          {toolbarActions}
        </div>
      </div>
      <Table>
        <TableHeader className="bg-[var(--muted)]">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={
                    header.column.id === "rank"
                      ? "w-16"
                      : header.column.id === "watchedOn"
                        ? "w-36"
                        : header.column.id === "language"
                          ? "w-28"
                          : header.column.id === "status"
                            ? "w-24"
                            : header.column.id === "watchedWith"
                              ? "w-56"
                              : header.column.id === "actions"
                                ? "w-24"
                              : undefined
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  draggedMovieId === row.original.movieId && "opacity-50",
                  dropTarget?.movieId === row.original.movieId &&
                    dropTarget.position === "before" &&
                    "shadow-[inset_0_2px_0_0_var(--foreground)]",
                  dropTarget?.movieId === row.original.movieId &&
                    dropTarget.position === "after" &&
                    "shadow-[inset_0_-2px_0_0_var(--foreground)]",
                  splicedMovieId === row.original.movieId &&
                    "movie-row-splice",
                )}
                onDragOver={(event) =>
                  handleDragOver(event, row.original.movieId)
                }
                onDrop={(event) => handleDrop(event, row.original.movieId)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {cell.column.id === "rank" ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          draggable={canDragReorder}
                          disabled={!canReorder}
                          aria-label={`Reorder ${row.original.title}`}
                          title={
                            canDragReorder
                              ? "Drag to reorder"
                              : isSavingOrder
                                ? "Saving order"
                                : "Sort by rank to reorder"
                          }
                          className={cn(
                            "-ml-1 flex size-5 items-center justify-center text-muted-foreground transition-opacity ease-out",
                            shouldFadeHandles
                              ? "opacity-35 duration-150"
                              : canReorder
                                ? "opacity-100 duration-[650ms]"
                                : "opacity-35 duration-[650ms]",
                            canDragReorder
                              ? "cursor-grab hover:text-foreground active:cursor-grabbing"
                              : canReorder
                                ? "cursor-default"
                                : "cursor-not-allowed",
                          )}
                          onDragStart={(event) =>
                            handleDragStart(event, row.original.movieId)
                          }
                          onDragEnd={handleDragEnd}
                        >
                          <GripVertical className="size-3.5" />
                        </button>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                No movies match the current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}
