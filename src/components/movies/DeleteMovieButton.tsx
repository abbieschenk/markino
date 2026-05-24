"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { deleteMovieEntry } from "@/app/movies/actions";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
        >
          Delete
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
