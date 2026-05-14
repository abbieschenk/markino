"use client";

import { startTransition, useEffect, useId, useRef, useState } from "react";

import { addMovieEntry } from "@/app/movies/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AddMovieDialogProps = {
  canAdd: boolean;
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

export function AddMovieDialog({
  canAdd,
  watchedWithOptions,
}: AddMovieDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<AddMovieActionState>({
    status: "idle",
    message: null,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const dialogTitleId = useId();
  const titleInputId = useId();
  const watchedOnId = useId();
  const languageId = useId();
  const statusId = useId();
  const watchedWithId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

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
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => setOpen(true)}
        disabled={!canAdd}
      >
        Add
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="w-full max-w-2xl border border-[var(--border)] bg-[var(--background)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <form ref={formRef} onSubmit={handleSubmit} className="grid gap-0">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div className="space-y-1">
                  <p
                    id={dialogTitleId}
                    className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]"
                  >
                    Add Movie
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </div>
              <div className="grid gap-5 px-4 py-4">
                <div className="grid gap-1.5">
                  <label
                    htmlFor={titleInputId}
                    className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
                  >
                    Title
                  </label>
                  <Input id={titleInputId} name="title" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label
                      htmlFor={watchedOnId}
                      className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
                    >
                      Date Watched
                    </label>
                    <Input
                      id={watchedOnId}
                      name="watchedOn"
                      type="date"
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label
                      htmlFor={languageId}
                      className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
                    >
                      Language
                    </label>
                    <Input
                      id={languageId}
                      name="languageWatched"
                      placeholder="English"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                  <div className="grid gap-1.5">
                    <label
                      htmlFor={statusId}
                      className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
                    >
                      Status
                    </label>
                    <select
                      id={statusId}
                      name="status"
                      defaultValue="watched"
                      className="h-9 border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--foreground)]"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label
                      htmlFor={watchedWithId}
                      className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
                    >
                      Watched With
                    </label>
                    <select
                      id={watchedWithId}
                      name="watchedWith"
                      multiple
                      size={Math.min(Math.max(watchedWithOptions.length, 4), 8)}
                      className="min-h-32 border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--foreground)]"
                    >
                      {watchedWithOptions.map((handle) => (
                        <option key={handle} value={handle}>
                          {handle}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Hold Command or Ctrl to select multiple handles.
                    </p>
                  </div>
                </div>
                {state.message ? (
                  <p
                    className={
                      state.status === "error"
                        ? "border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]"
                        : "border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm"
                    }
                  >
                    {state.message}
                  </p>
                ) : null}
              </div>
              <div className="flex justify-end border-t border-[var(--border)] px-4 py-3">
                <div className="flex items-center gap-2">
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
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
