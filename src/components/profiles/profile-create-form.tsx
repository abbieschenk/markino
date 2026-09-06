"use client";

import { startTransition, useState, type FormEvent } from "react";

import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getActionData } from "@/lib/action-result";
import type { LocalUser } from "@/lib/local-profiles";
import { persistSelectedProfile } from "@/components/profiles/profile-selection";

type ProfileCreateFormProps = {
  onCreated?: (profile: LocalUser) => void;
};

export function ProfileCreateForm({ onCreated }: ProfileCreateFormProps) {
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await getActionData(
          actions.createLocalProfile({ handle, displayName }),
        );

        if (result.status === "error") {
          setMessage(result.message);
          return;
        }

        persistSelectedProfile(result.profile.id);
        onCreated?.(result.profile);
        window.location.reload();
      } catch (error) {
        console.error("Failed to create profile", error);
        setMessage("Unable to create profile.");
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-1.5">
        <label
          htmlFor="profile-handle"
          className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          Handle
        </label>
        <Input
          id="profile-handle"
          value={handle}
          onChange={(event) => setHandle(event.target.value.toLowerCase())}
          minLength={3}
          maxLength={32}
          pattern="[a-z0-9_-]+"
          autoComplete="off"
          required
          className="h-8 rounded-none px-2 text-sm"
        />
      </div>
      <div className="grid gap-1.5">
        <label
          htmlFor="profile-display-name"
          className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          Display Name
        </label>
        <Input
          id="profile-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={128}
          autoComplete="off"
          required
          className="h-8 rounded-none px-2 text-sm"
        />
      </div>
      {message ? (
        <p className="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-2 py-1.5 text-xs text-[var(--destructive)]">
          {message}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Creating..." : "Create Profile"}
      </Button>
    </form>
  );
}

