"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type SignInFormProps = {
  signupsEnabled: boolean;
};

type FormState = {
  email: string;
  password: string;
};

const INITIAL_STATE: FormState = {
  email: "",
  password: "",
};

export function SignInForm({ signupsEnabled }: SignInFormProps) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const result = await authClient.signIn.email({
      email: form.email.trim(),
      password: form.password,
      callbackURL: "/movies",
    });

    setIsPending(false);

    if (result.error) {
      setError(result.error.message || "Unable to sign in.");
      return;
    }

    window.location.assign("/movies");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-0 border border-[var(--border)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          Sign In
        </p>
      </div>
      <div className="grid gap-5 px-4 py-4">
        <div className="grid gap-1.5">
          <label
            htmlFor="email"
            className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
          >
            Email
          </label>
          <Input
            id="email"
            name="username"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            autoComplete="username"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <label
            htmlFor="password"
            className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
          >
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            autoComplete="current-password"
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
        <div className="text-xs text-[var(--muted-foreground)]">
          {signupsEnabled ? (
            <p>
              Need an account?{" "}
              <a
                href="/sign-up"
                className="text-[var(--foreground)] underline underline-offset-4"
              >
                Create one
              </a>
            </p>
          ) : (
            <p>Account creation is currently disabled.</p>
          )}
        </div>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Signing In..." : "Sign In"}
        </Button>
      </div>
    </form>
  );
}
