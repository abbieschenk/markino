"use client";

import { startTransition, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

import { deleteMovieEntry } from "@/app/movies/actions";
import { Button } from "@/components/ui/Button";

type DeleteMovieButtonProps = {
  title: string;
  watchEntryId: string;
};

export function DeleteMovieButton({
  title,
  watchEntryId,
}: DeleteMovieButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogTitleId = useId();

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

  function handleDelete() {
    setPending(true);
    setError(null);

    startTransition(async () => {
      const result = await deleteMovieEntry(watchEntryId);

      setPending(false);

      if (result.status === "error") {
        setError(result.message || "Unable to delete the movie entry.");
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
        onClick={() => setOpen(true)}
      >
        Delete
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
            className="w-full max-w-md border border-[var(--border)] bg-[var(--background)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[var(--border)] px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                Confirm Delete
              </p>
            </div>
            <div className="grid gap-4 px-4 py-4 text-sm">
              <p>
                Delete <span className="font-medium">{title}</span> from your
                watched collection.
              </p>
              {error ? (
                <p className="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]">
                  {error}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={pending}
              >
                {pending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
