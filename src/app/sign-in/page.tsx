import { SignInFormShell } from "@/components/auth/SignInFormShell";

export default function SignInPage() {
  return (
    <section className="grid gap-8 py-12 lg:grid-cols-[minmax(0,20rem)_minmax(24rem,34rem)] lg:justify-between">
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Sign In
          </p>
          <h1 className="text-3xl leading-tight font-medium tracking-[-0.04em] sm:text-4xl">
            Return to your films.
          </h1>
          <p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Sign in to your Markino account.
          </p>
        </div>
      </div>
      <SignInFormShell />
    </section>
  );
}
