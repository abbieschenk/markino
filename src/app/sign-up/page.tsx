import { redirect } from "next/navigation";

import { SignUpFormShell } from "@/components/auth/SignUpFormShell";
import { areSignupsEnabled } from "@/lib/auth-config";

export default function SignUpPage() {
  if (!areSignupsEnabled()) {
    redirect("/sign-in");
  }

  return (
    <section className="grid gap-8 py-12 lg:grid-cols-[minmax(0,20rem)_minmax(24rem,34rem)] lg:justify-between">
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Sign Up
          </p>
          <h1 className="text-3xl leading-tight font-medium tracking-[-0.04em] sm:text-4xl">
            Create an account to track your films.
          </h1>
          <p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Signup is not yet available publicly.
          </p>
        </div>
      </div>
      <SignUpFormShell />
    </section>
  );
}
