"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type FormState = {
  name: string;
  handle: string;
  email: string;
  password: string;
};

const INITIAL_STATE: FormState = {
  name: "",
  handle: "",
  email: "",
  password: "",
};

const HANDLE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function normalizeHandle(value: string) {
  return value.toLowerCase().trim();
}

function validateHandle(handle: string) {
  if (handle.length < 3 || handle.length > 32) {
    return "Handle must be between 3 and 32 characters.";
  }

  if (!HANDLE_PATTERN.test(handle)) {
    return "Use lowercase letters, numbers, and single separators (. _ -).";
  }

  return null;
}

export function SignUpForm() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedHandle = normalizeHandle(form.handle);
    const handleError = validateHandle(normalizedHandle);

    if (handleError) {
      setError(handleError);
      return;
    }

    setIsPending(true);

    const payload: Parameters<typeof authClient.signUp.email>[0] & {
      handle: string;
    } = {
      name: form.name.trim(),
      handle: normalizedHandle,
      email: form.email.trim(),
      password: form.password,
      callbackURL: "/movies",
    };

    const result = await authClient.signUp.email(payload);

    setIsPending(false);

    if (result.error) {
      setError(result.error.message || "Unable to create account.");
      return;
    }

    startTransition(() => {
      router.push("/movies");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-0 border border-[var(--border)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          Create Account
        </p>
      </div>
      <div className="grid gap-5 px-4 py-4">
        <div className="grid gap-1.5">
          <label htmlFor="name" className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Name
          </label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            autoComplete="name"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="handle" className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Handle
          </label>
          <Input
            id="handle"
            value={form.handle}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                handle: normalizeHandle(event.target.value),
              }))
            }
            autoComplete="username"
            spellCheck={false}
            required
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            Used in shared watch logs. Lowercase only.
          </p>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="email" className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            autoComplete="email"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="password" className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            autoComplete="new-password"
            required
          />
        </div>
        {error ? (
          <p className="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
        <p className="text-xs text-[var(--muted-foreground)]">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-[var(--foreground)] underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Creating..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
