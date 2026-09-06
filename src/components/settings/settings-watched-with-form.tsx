"use client";

import { startTransition, useId, useState, type FormEvent } from "react";

import { actions } from "astro:actions";
import { getActionData } from "@/lib/action-result";
import { WatchedWithCombobox } from "@/components/movies/WatchedWithCombobox";
import { Button } from "@/components/ui/button";

type SettingsWatchedWithFormProps = {
  defaultWatchedWith: string[];
  watchedWithOptions: string[];
};

type SettingsActionState = {
  status: "idle" | "error" | "success";
  message: string | null;
};

export function SettingsWatchedWithForm({
  defaultWatchedWith,
  watchedWithOptions,
}: SettingsWatchedWithFormProps) {
  const [pending, setPending] = useState(false);
  const [watchedWith, setWatchedWith] = useState(defaultWatchedWith);
  const [state, setState] = useState<SettingsActionState>({
    status: "idle",
    message: null,
  });
  const watchedWithId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setPending(true);
    setState({
      status: "idle",
      message: null,
    });

    startTransition(async () => {
      const nextState = await getActionData(actions.updateDefaultWatchedWith(formData));

      setState(nextState);
      setPending(false);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 border border-[var(--border)] p-4"
    >
      <div className="grid gap-1.5">
        <label
          htmlFor={watchedWithId}
          className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
        >
          Default Watched With
        </label>
        <WatchedWithCombobox
          id={watchedWithId}
          name="defaultWatchedWith"
          options={watchedWithOptions}
          value={watchedWith}
          onValueChange={setWatchedWith}
        />
      </div>
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]"
              : "border border-[var(--border)] bg-[var(--accent)] px-3 py-2 text-sm text-[var(--muted-foreground)]"
          }
        >
          {state.message}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
