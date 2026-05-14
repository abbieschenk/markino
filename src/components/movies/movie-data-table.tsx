"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useMemo, useState } from "react";
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
import type { MovieLedgerEntry, WatchStatus } from "@/lib/movies";

type MovieDataTableProps = {
  columns: ColumnDef<MovieLedgerEntry>[];
  data: MovieLedgerEntry[];
};

const statusOptions: Array<WatchStatus | "all"> = [
  "all",
  "watched",
  "dnf",
  "dns",
];

export function MovieDataTable({ columns, data }: MovieDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "rank", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const watchedWithOptions = useMemo(() => {
    const people = new Set<string>();

    for (const movie of data) {
      for (const person of movie.watchedWith) {
        people.add(person);
      }
    }

    return ["all", ...Array.from(people).sort((left, right) => left.localeCompare(right))];
  }, [data]);

  const table = useReactTable({
    data,
    columns,
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

  const statusFilter = (table.getColumn("status")?.getFilterValue() as string) ?? "all";
  const watchedWithFilter =
    (table.getColumn("watchedWith")?.getFilterValue() as string) ?? "all";

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
        <div className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} visible
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
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
