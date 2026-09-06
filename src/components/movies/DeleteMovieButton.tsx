"use client";

import { X } from "@phosphor-icons/react";
import { startTransition, useState } from "react";

import { actions } from "astro:actions";
import { getActionData } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteMovieButtonProps = {
  title: string;
  userId: string;
  watchEntryId: string;
};

export function DeleteMovieButton({
  title,
  userId,
  watchEntryId,
}: DeleteMovieButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setPending(true);
    setError(null);

    startTransition(async () => {
      const result = await getActionData(
        actions.deleteMovieEntry({ userId, watchEntryId }),
      );

      setPending(false);

      if (result.status === "error") {
        setError(result.message || "Unable to delete the movie entry.");
        return;
      }

      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-[var(--muted-foreground)] hover:bg-transparent hover:text-[var(--destructive)]"
          aria-label={`Delete ${title}`}
          title={`Delete ${title}`}
        >
          <X aria-hidden="true" size={14} weight="regular" />
          <span className="sr-only">Delete</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-md rounded-none border border-[var(--border)] bg-[var(--background)] p-0 text-[var(--foreground)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
      >
        <DialogHeader className="border-b border-[var(--border)] px-4 py-3">
          <DialogTitle className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Confirm Delete
          </DialogTitle>
        </DialogHeader>
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
        <DialogFooter className="justify-end rounded-none border-t border-[var(--border)] bg-transparent px-4 py-3">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
