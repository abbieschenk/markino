"use client";

import { Check, X } from "@phosphor-icons/react";
import { startTransition, useId, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { toast } from "sonner";

import { actions } from "astro:actions";
import { DatePickerField } from "@/components/movies/DatePickerField";
import { WatchedWithCombobox } from "@/components/movies/WatchedWithCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  MovieLedgerEntry,
  MovieWatchEntry,
  WatchDatePrecision,
} from "@/lib/movies";
import { getActionData } from "@/lib/action-result";
import { cn } from "@/lib/utils";

export type EditableMovieEntryField = "watchedOn" | "language" | "watchedWith";
export type EditableMovieEntry = Pick<
  MovieLedgerEntry | MovieWatchEntry,
  | "watchEntryId"
  | "canEdit"
  | "title"
  | "watchedOn"
  | "watchedYear"
  | "watchedDatePrecision"
  | "watchedDateDisplay"
  | "language"
  | "watchedWith"
>;

export type MovieEntryEditTarget = {
  anchor: {
    left: number;
    top: number;
    width: number;
  };
  entry: EditableMovieEntry;
  field: EditableMovieEntryField;
};

function getEditPanelAnchor(
  event: MouseEvent<HTMLButtonElement>,
  field: EditableMovieEntryField,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const panelWidth = Math.min(
    field === "watchedWith" ? 520 : 420,
    window.innerWidth - 24,
  );

  return {
    left: Math.max(12, Math.min(rect.left, window.innerWidth - panelWidth - 12)),
    top: rect.bottom + 4,
    width: panelWidth,
  };
}

function buildUpdateInput(
  entry: EditableMovieEntry,
  userId: string,
  updates: Partial<
    Pick<
      MovieLedgerEntry,
      "watchedOn" | "watchedDatePrecision" | "language" | "watchedWith"
    >
  >,
) {
  return {
    userId,
    watchEntryId: entry.watchEntryId,
    watchedOn: updates.watchedOn ?? entry.watchedOn,
    watchedDatePrecision:
      updates.watchedDatePrecision ?? entry.watchedDatePrecision,
    languageWatched: updates.language ?? entry.language,
    watchedWithHandles: updates.watchedWith ?? entry.watchedWith,
  };
}

function stopEditingKeyDown(
  event: KeyboardEvent,
  onSave: () => void,
  onCancel: () => void,
) {
  if (event.key === "Enter") {
    event.preventDefault();
    onSave();
  }

  if (event.key === "Escape") {
    event.preventDefault();
    onCancel();
  }
}

function formatYearDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function EditableMovieEntryCellButton({
  entry,
  field,
  isActive,
  onEdit,
  value,
}: {
  entry: EditableMovieEntry;
  field: Exclude<EditableMovieEntryField, "watchedWith">;
  isActive: boolean;
  onEdit: (target: MovieEntryEditTarget) => void;
  value: string;
}) {
  if (!entry.canEdit) {
    return <span className="text-muted-foreground">{value}</span>;
  }

  return (
    <button
      type="button"
      className={cn(
        "block w-full min-w-0 truncate px-1 py-0.5 text-left text-muted-foreground hover:text-foreground",
        isActive && "bg-[var(--muted)] text-foreground",
      )}
      onClick={(event) =>
        onEdit({ anchor: getEditPanelAnchor(event, field), entry, field })
      }
    >
      {value}
    </button>
  );
}

export function EditableWatchedWithCellButton({
  entry,
  isActive,
  onEdit,
  value,
}: {
  entry: EditableMovieEntry;
  isActive: boolean;
  onEdit: (target: MovieEntryEditTarget) => void;
  value: string[];
}) {
  const displayValue = value.join(", ");

  if (!entry.canEdit) {
    return (
      <span className="text-muted-foreground">
        {displayValue || <span aria-hidden="true">-</span>}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "block w-full min-w-0 truncate px-1 py-0.5 text-left text-muted-foreground hover:text-foreground",
        isActive && "bg-[var(--muted)] text-foreground",
      )}
      onClick={(event) =>
        onEdit({
          anchor: getEditPanelAnchor(event, "watchedWith"),
          entry,
          field: "watchedWith",
        })
      }
    >
      {displayValue || <span aria-hidden="true">-</span>}
    </button>
  );
}

function getFieldLabel(field: EditableMovieEntryField) {
  if (field === "watchedOn") {
    return "Watched";
  }

  if (field === "watchedWith") {
    return "With";
  }

  return "Language";
}

export function MovieEntryEditPanel({
  target,
  userId,
  watchedWithOptions,
  onCancel,
}: {
  target: MovieEntryEditTarget;
  userId: string;
  watchedWithOptions: string[];
  onCancel: () => void;
}) {
  const fieldId = useId();
  const [draftText, setDraftText] = useState(target.entry.language);
  const [draftWatchedOn, setDraftWatchedOn] = useState(
    target.entry.watchedDatePrecision === "day" ? target.entry.watchedOn : "",
  );
  const [draftWatchedYear, setDraftWatchedYear] = useState(
    target.entry.watchedDatePrecision === "year"
      ? target.entry.watchedOn
      : String(target.entry.watchedYear).padStart(4, "0"),
  );
  const [draftDatePrecision, setDraftDatePrecision] =
    useState<WatchDatePrecision>(target.entry.watchedDatePrecision);
  const [draftWatchedWith, setDraftWatchedWith] = useState<string[]>(
    target.entry.watchedWith,
  );
  const [pending, setPending] = useState(false);

  function saveEdit() {
    const nextTextValue = draftText.trim();
    const currentWatchedWith = [...target.entry.watchedWith].sort().join("\n");
    const nextWatchedWith = [...draftWatchedWith].sort().join("\n");
    const nextWatchedValue =
      draftDatePrecision === "day"
        ? draftWatchedOn.trim()
        : draftWatchedYear.trim();
    const hasChanged =
      target.field === "watchedWith"
        ? nextWatchedWith !== currentWatchedWith
        : target.field === "language"
          ? nextTextValue !== target.entry.language
          : nextWatchedValue !== target.entry.watchedOn ||
            draftDatePrecision !== target.entry.watchedDatePrecision;

    if (!hasChanged) {
      onCancel();
      return;
    }

    setPending(true);

    startTransition(async () => {
      try {
        const result = await getActionData(
          actions.updateMovieEntry(
          buildUpdateInput(target.entry, userId, {
            language: target.field === "language" ? nextTextValue : undefined,
            watchedOn:
              target.field === "watchedOn" ? nextWatchedValue : undefined,
            watchedDatePrecision:
              target.field === "watchedOn" ? draftDatePrecision : undefined,
            watchedWith:
              target.field === "watchedWith" ? draftWatchedWith : undefined,
          }),
          ),
        );

        if (result.status === "error") {
          toast.error(result.message ?? "Unable to update the movie entry.");
          return;
        }

        onCancel();
        window.location.reload();
      } catch (error) {
        console.error("Failed to update movie entry", error);
        toast.error("Unable to update the movie entry.");
      } finally {
        setPending(false);
      }
    });
  }

  function cancelEdit() {
    if (pending) {
      return;
    }

    onCancel();
  }

  return (
    <div
      className="fixed z-50 grid gap-2 border border-[var(--border)] bg-[var(--background)] px-3 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.18)] md:grid-cols-[minmax(8rem,0.9fr)_minmax(12rem,1.6fr)_auto] md:items-center"
      style={{
        left: target.anchor.left,
        top: target.anchor.top,
        width: target.anchor.width,
      }}
    >
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Edit {getFieldLabel(target.field)}
        </div>
        <div className="truncate text-sm font-medium">{target.entry.title}</div>
      </div>
      {target.field === "watchedOn" ? (
        <div className="grid grid-cols-[5.25rem_1fr]">
          <Select
            value={draftDatePrecision}
            onValueChange={(value) =>
              setDraftDatePrecision(value as WatchDatePrecision)
            }
            disabled={pending}
          >
            <SelectTrigger
              aria-label="Date precision"
              className="h-8 w-full rounded-none border-r-0 border-[var(--border)] bg-[var(--background)] px-2 text-sm shadow-none data-[size=default]:h-8"
            >
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-[var(--border)]">
              <SelectItem value="day">Date</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          {draftDatePrecision === "day" ? (
            <DatePickerField
              id={fieldId}
              name={`${fieldId}-watched-on`}
              autoFocus
              disabled={pending}
              value={draftWatchedOn}
              onValueChange={setDraftWatchedOn}
              onKeyDown={(event) =>
                stopEditingKeyDown(event, saveEdit, cancelEdit)
              }
              inputClassName="h-8 rounded-none border-r-0 border-[var(--border)] px-2 font-mono text-sm tabular-nums shadow-none"
            />
          ) : (
            <Input
              id={fieldId}
              autoFocus
              value={draftWatchedYear}
              disabled={pending}
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              className="h-8 rounded-none border-[var(--border)] px-2 font-mono text-sm tabular-nums shadow-none"
              onChange={(event) =>
                setDraftWatchedYear(formatYearDigits(event.target.value))
              }
              onKeyDown={(event) =>
                stopEditingKeyDown(event, saveEdit, cancelEdit)
              }
            />
          )}
        </div>
      ) : target.field === "language" ? (
        <Input
          autoFocus
          value={draftText}
          disabled={pending}
          className="h-8 rounded-none border-[var(--border)] px-2 text-sm shadow-none"
          onChange={(event) => setDraftText(event.target.value)}
          onKeyDown={(event) => stopEditingKeyDown(event, saveEdit, cancelEdit)}
        />
      ) : (
        <div className={cn(pending && "pointer-events-none opacity-60")}>
          <WatchedWithCombobox
            id={fieldId}
            name={`${fieldId}-watched-with`}
            options={watchedWithOptions}
            value={draftWatchedWith}
            onValueChange={setDraftWatchedWith}
          />
        </div>
      )}
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 text-muted-foreground hover:bg-transparent hover:text-foreground"
          disabled={pending}
          onClick={saveEdit}
          aria-label="Save edit"
          title="Save"
        >
          <Check aria-hidden="true" size={15} weight="regular" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 text-muted-foreground hover:bg-transparent hover:text-foreground"
          disabled={pending}
          onClick={cancelEdit}
          aria-label="Cancel edit"
          title="Cancel"
        >
          <X aria-hidden="true" size={15} weight="regular" />
        </Button>
      </div>
    </div>
  );
}
