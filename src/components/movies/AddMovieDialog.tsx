"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { startTransition, useId, useRef, useState } from "react";

import { addMovieEntry } from "@/app/movies/actions";
import { DatePickerField } from "@/components/movies/DatePickerField";
import { MovieTitleSearchField } from "@/components/movies/movie-title-search-field";
import { WatchedWithCombobox } from "@/components/movies/WatchedWithCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AddMovieDialogProps = {
  canAdd: boolean;
  defaultWatchedWith: string[];
  watchedWithOptions: string[];
};

type AddMovieActionState = {
  status: "idle" | "error" | "success";
  message: string | null;
};

const STATUS_OPTIONS = [
  { value: "watched", label: "Watched" },
  { value: "dnf", label: "DNF" },
  { value: "dns", label: "DNS" },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];
type DatePrecisionValue = "day" | "year";
type MovieFormRow = {
  id: string;
  status: StatusValue;
  watchedDatePrecision: DatePrecisionValue;
  watchedOn: string;
  watchedYear: string;
  watchedWith: string[];
};

function createMovieFormRow(
  id: number,
  defaultWatchedWith: string[],
): MovieFormRow {
  return {
    id: String(id),
    status: "watched",
    watchedDatePrecision: "day",
    watchedOn: "",
    watchedYear: "",
    watchedWith: defaultWatchedWith,
  };
}

function formatYearDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function createMovieFormRowFromPrevious(
  id: number,
  previousRow: MovieFormRow | undefined,
  defaultWatchedWith: string[],
): MovieFormRow {
  return {
    ...createMovieFormRow(id, defaultWatchedWith),
    watchedDatePrecision: previousRow?.watchedDatePrecision ?? "day",
    watchedOn: previousRow?.watchedOn ?? "",
    watchedYear: previousRow?.watchedYear ?? "",
  };
}

export function AddMovieDialog({
  canAdd,
  defaultWatchedWith,
  watchedWithOptions,
}: AddMovieDialogProps) {
  const nextRowIdRef = useRef(1);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<AddMovieActionState>({
    status: "idle",
    message: null,
  });
  const [rows, setRows] = useState<MovieFormRow[]>([
    createMovieFormRow(0, defaultWatchedWith),
  ]);
  const [formKey, setFormKey] = useState(0);
  const [comboboxLayerElement, setComboboxLayerElement] =
    useState<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldIdPrefix = useId();

  function resetRows() {
    nextRowIdRef.current = 1;
    setRows([createMovieFormRow(0, defaultWatchedWith)]);
  }

  function addRow() {
    setRows((currentRows) => {
      const previousRow = currentRows.at(-1);

      return [
        ...currentRows,
        createMovieFormRowFromPrevious(
          nextRowIdRef.current++,
          previousRow,
          defaultWatchedWith,
        ),
      ];
    });
  }

  function removeRow(rowId: string) {
    setRows((currentRows) =>
      currentRows.length === 1
        ? currentRows
        : currentRows.filter((row) => row.id !== rowId),
    );
  }

  function updateRow(rowId: string, nextRow: Partial<MovieFormRow>) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...nextRow,
            }
          : row,
      ),
    );
  }

  function preventComboboxOutsideDismiss(event: Event) {
    const target = event.target as HTMLElement | null;

    if (target?.closest("[data-slot='combobox-content']")) {
      event.preventDefault();
    }

    if (target?.closest("[data-slot='movie-title-search-content']")) {
      event.preventDefault();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    setPending(true);
    setState({
      status: "idle",
      message: null,
    });

    startTransition(async () => {
      const nextState = await addMovieEntry(formData);

      setState(nextState);
      setPending(false);

      if (nextState.status === "success") {
        formRef.current?.reset();
        setFormKey((current) => current + 1);
        resetRows();
        setOpen(false);
      }
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setState({
        status: "idle",
        message: null,
      });
      resetRows();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="lg" disabled={!canAdd}>
          Add
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="w-[min(96vw,72rem)] max-w-none overflow-visible rounded-none border border-[var(--border)] bg-[var(--background)] p-0 text-[var(--foreground)] shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:max-w-none"
        onFocusOutside={preventComboboxOutsideDismiss}
        onInteractOutside={preventComboboxOutsideDismiss}
        onPointerDownOutside={preventComboboxOutsideDismiss}
      >
        <div
          ref={setComboboxLayerElement}
          className="pointer-events-none absolute inset-0 z-20"
        />
        <form
          key={formKey}
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid min-w-0 gap-0"
        >
          <DialogHeader className="border-b border-[var(--border)] px-4 py-3">
            <DialogTitle className="select-none text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Add Movie
            </DialogTitle>
          </DialogHeader>
          <div className="grid min-w-0 gap-3 overflow-x-auto px-4 py-4">
            <div className="hidden grid-cols-[minmax(12rem,1.5fr)_14.5rem_minmax(8rem,0.8fr)_8rem_minmax(13rem,1.2fr)_2.25rem] gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:grid">
              <span className="select-none">Title</span>
              <span className="select-none">Date Watched</span>
              <span className="select-none">Language</span>
              <span className="select-none">Status</span>
              <span className="select-none">Watched With</span>
              <span />
            </div>
            <div className="grid gap-2">
              {rows.map((row, index) => {
                const titleInputId = `${fieldIdPrefix}-title-${row.id}`;
                const watchedOnId = `${fieldIdPrefix}-watched-on-${row.id}`;
                const languageId = `${fieldIdPrefix}-language-${row.id}`;
                const watchedWithId = `${fieldIdPrefix}-watched-with-${row.id}`;

                return (
                  <div
                    key={row.id}
                    className="grid gap-2 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(12rem,1.5fr)_14.5rem_minmax(8rem,0.8fr)_8rem_minmax(13rem,1.2fr)_2.25rem] lg:items-start lg:border-b-0 lg:pb-0"
                  >
                    <input type="hidden" name="movieRowId" value={row.id} />
                    <div className="grid gap-1.5">
                      <label
                        htmlFor={titleInputId}
                        className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:sr-only"
                      >
                        Title
                      </label>
                      <MovieTitleSearchField
                        id={titleInputId}
                        titleName={`title:${row.id}`}
                        tmdbIdName={`tmdbId:${row.id}`}
                        portalContainer={comboboxLayerElement}
                        required
                        ariaLabel={`Row ${index + 1} title`}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label
                        htmlFor={watchedOnId}
                        className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:sr-only"
                      >
                        Date Watched
                      </label>
                      <div className="grid grid-cols-[5.25rem_1fr]">
                        <input
                          type="hidden"
                          name={`watchedDatePrecision:${row.id}`}
                          value={row.watchedDatePrecision}
                        />
                        <Select
                          value={row.watchedDatePrecision}
                          onValueChange={(value) =>
                            updateRow(row.id, {
                              watchedDatePrecision: value as DatePrecisionValue,
                            })
                          }
                        >
                          <SelectTrigger
                            aria-label={`Row ${index + 1} date precision`}
                            className="h-9 w-full rounded-none border-r-0 border-[var(--border)] bg-[var(--background)] px-2 shadow-none data-[size=default]:h-9"
                          >
                            <SelectValue placeholder="Date" />
                          </SelectTrigger>
                          <SelectContent className="rounded-none border-[var(--border)]">
                            <SelectItem value="day">Date</SelectItem>
                            <SelectItem value="year">Year</SelectItem>
                          </SelectContent>
                        </Select>
                        {row.watchedDatePrecision === "day" ? (
                          <DatePickerField
                            id={watchedOnId}
                            name={`watchedOn:${row.id}`}
                            value={row.watchedOn}
                            onValueChange={(watchedOn) =>
                              updateRow(row.id, { watchedOn })
                            }
                            required
                          />
                        ) : (
                          <Input
                            id={watchedOnId}
                            name={`watchedYear:${row.id}`}
                            value={row.watchedYear}
                            placeholder="YYYY"
                            inputMode="numeric"
                            pattern="\\d{4}"
                            maxLength={4}
                            required
                            autoComplete="off"
                            aria-label={`Row ${index + 1} watched year`}
                            className="h-9 rounded-none border-[var(--border)] px-2 font-mono tabular-nums shadow-none"
                            onChange={(event) =>
                              updateRow(row.id, {
                                watchedYear: formatYearDigits(
                                  event.currentTarget.value,
                                ),
                              })
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <label
                        htmlFor={languageId}
                        className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:sr-only"
                      >
                        Language
                      </label>
                      <Input
                        id={languageId}
                        name={`languageWatched:${row.id}`}
                        placeholder="English"
                        aria-label={`Row ${index + 1} language`}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:sr-only">
                        Status
                      </span>
                      <input
                        type="hidden"
                        name={`status:${row.id}`}
                        value={row.status}
                      />
                      <Select
                        value={row.status}
                        onValueChange={(value) =>
                          updateRow(row.id, { status: value as StatusValue })
                        }
                      >
                        <SelectTrigger
                          aria-label={`Row ${index + 1} status`}
                          className="h-9 rounded-none border-[var(--border)] bg-[var(--background)] px-3 shadow-none data-[size=default]:h-9"
                        >
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-[var(--border)]">
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid min-w-0 gap-1.5">
                      <label
                        htmlFor={watchedWithId}
                        className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:sr-only"
                      >
                        Watched With
                      </label>
                      <WatchedWithCombobox
                        id={watchedWithId}
                        name={`watchedWith:${row.id}`}
                        options={watchedWithOptions}
                        portalContainer={comboboxLayerElement}
                        value={row.watchedWith}
                        onValueChange={(watchedWith) =>
                          updateRow(row.id, { watchedWith })
                        }
                      />
                    </div>
                    <div className="flex justify-end lg:pt-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-lg"
                        className="h-9 w-9 rounded-none"
                        disabled={rows.length === 1}
                        aria-label={`Remove row ${index + 1}`}
                        title="Remove row"
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash className="size-4" weight="regular" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            {state.status === "error" && state.message ? (
              <p
                className="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]"
              >
                {state.message}
              </p>
            ) : null}
          </div>
          <DialogFooter className="justify-between rounded-none border-t border-[var(--border)] bg-transparent px-4 py-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              onClick={addRow}
            >
              <Plus className="size-4" weight="regular" />
              Add Movie
            </Button>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
