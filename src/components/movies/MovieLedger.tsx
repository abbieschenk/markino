"use client";

import { useMemo, useState, type ReactNode } from "react";

import { createMovieColumns } from "@/components/movies/MovieColumns";
import { DeleteMovieButton } from "@/components/movies/DeleteMovieButton";
import {
  EditableMovieEntryCellButton,
  EditableWatchedWithCellButton,
  MovieEntryEditPanel,
  type EditableMovieEntryField,
  type MovieEntryEditTarget,
} from "@/components/movies/editable-movie-entry-cells";
import { MovieDataTable } from "@/components/movies/MovieDataTable";
import type { MovieLedgerEntry, MovieWatchEntry } from "@/lib/movies";

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

  function isActiveEditTarget(
    entry: MovieWatchEntry,
    field: EditableMovieEntryField,
  ) {
    return (
      editTarget?.entry.watchEntryId === entry.watchEntryId &&
      editTarget.field === field
    );
  }

  return (
    <>
      <MovieDataTable
        columns={columns}
        data={data}
        renderExpandedRow={(entry) => (
          <MovieWatchHistory
            entry={entry}
            isActiveEditTarget={isActiveEditTarget}
            onEdit={setEditTarget}
          />
        )}
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

function MovieWatchHistory({
  entry,
  isActiveEditTarget,
  onEdit,
}: {
  entry: MovieLedgerEntry;
  isActiveEditTarget: (
    entry: MovieWatchEntry,
    field: EditableMovieEntryField,
  ) => boolean;
  onEdit: (target: MovieEntryEditTarget) => void;
}) {
  return (
    <div className="ml-16 overflow-x-auto border-l border-[var(--border)]">
      <div className="min-w-[42rem]">
        <div className="grid grid-cols-[8rem_7rem_6rem_minmax(12rem,1fr)_3rem] items-center border-b border-[var(--border)] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <div>Watched</div>
          <div>Language</div>
          <div>Status</div>
          <div>With</div>
          <div />
        </div>
        {entry.watchEntries.map((watchEntry) => (
          <div
            key={watchEntry.watchEntryId}
            className="grid grid-cols-[8rem_7rem_6rem_minmax(12rem,1fr)_3rem] items-center border-b border-[var(--border)] px-3 py-1.5 text-sm last:border-b-0"
          >
            <EditableMovieEntryCellButton
              entry={watchEntry}
              field="watchedOn"
              isActive={isActiveEditTarget(watchEntry, "watchedOn")}
              onEdit={onEdit}
              value={watchEntry.watchedOn}
            />
            <EditableMovieEntryCellButton
              entry={watchEntry}
              field="language"
              isActive={isActiveEditTarget(watchEntry, "language")}
              onEdit={onEdit}
              value={watchEntry.language}
            />
            <span className="inline-flex min-w-12 justify-center border border-[var(--border)] px-1.5 py-0.5 text-[11px] uppercase tracking-[0.18em]">
              {watchEntry.status}
            </span>
            <EditableWatchedWithCellButton
              entry={watchEntry}
              isActive={isActiveEditTarget(watchEntry, "watchedWith")}
              onEdit={onEdit}
              value={watchEntry.watchedWith}
            />
            <div className="flex justify-end">
              <DeleteMovieButton
                title={`${entry.title} (${watchEntry.watchedOn})`}
                watchEntryId={watchEntry.watchEntryId}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
