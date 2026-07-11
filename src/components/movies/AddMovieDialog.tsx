"use client";

import { startTransition, useId, useRef, useState } from "react";

import { addMovieEntry } from "@/app/movies/actions";
import { DatePickerField } from "@/components/movies/DatePickerField";
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

export function AddMovieDialog({
  canAdd,
  defaultWatchedWith,
  watchedWithOptions,
}: AddMovieDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<AddMovieActionState>({
    status: "idle",
    message: null,
  });
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("watched");
  const [watchedWith, setWatchedWith] =
    useState<string[]>(defaultWatchedWith);
  const [formKey, setFormKey] = useState(0);
  const [comboboxLayerElement, setComboboxLayerElement] =
    useState<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputId = useId();
  const watchedOnId = useId();
  const languageId = useId();
  const watchedWithId = useId();

  function preventComboboxOutsideDismiss(event: Event) {
    const target = event.target as HTMLElement | null;

    if (target?.closest("[data-slot='combobox-content']")) {
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
        setStatus("watched");
        setWatchedWith(defaultWatchedWith);
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
      setStatus("watched");
      setWatchedWith(defaultWatchedWith);
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
        className="max-w-2xl rounded-none border border-[var(--border)] bg-[var(--background)] p-0 text-[var(--foreground)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
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
          className="grid gap-0"
        >
          <DialogHeader className="border-b border-[var(--border)] px-4 py-3">
            <DialogTitle className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Add Movie
            </DialogTitle>
          </DialogHeader>
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
                <DatePickerField id={watchedOnId} name="watchedOn" />
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
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Status
                </span>
                <input type="hidden" name="status" value={status} />
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as (typeof STATUS_OPTIONS)[number]["value"])
                  }
                >
                  <SelectTrigger className="h-9 rounded-none border-[var(--border)] bg-[var(--background)] px-3 shadow-none">
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
            </div>
            <div className="grid min-w-0 gap-1.5">
              <label
                htmlFor={watchedWithId}
                className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
              >
                Watched With
              </label>
              <WatchedWithCombobox
                id={watchedWithId}
                name="watchedWith"
                options={watchedWithOptions}
                portalContainer={comboboxLayerElement}
                value={watchedWith}
                onValueChange={setWatchedWith}
              />
            </div>
            {state.status === "error" && state.message ? (
              <p
                className="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]"
              >
                {state.message}
              </p>
            ) : null}
          </div>
          <DialogFooter className="justify-end rounded-none border-t border-[var(--border)] bg-transparent px-4 py-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
