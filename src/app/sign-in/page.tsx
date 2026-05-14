import { SignInFormShell } from "@/components/auth/sign-in-form-shell";

export default function SignInPage() {
  return (
    <section className="grid gap-8 py-12 lg:grid-cols-[minmax(0,20rem)_minmax(24rem,34rem)] lg:justify-between">
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Existing Ledger
          </p>
          <h1 className="text-3xl leading-tight font-medium tracking-[-0.04em] sm:text-4xl">
            Return to the table without rebuilding the account.
          </h1>
          <p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Sign in with the email and password attached to your Markino
            account. You will be sent back to the movie ledger immediately.
          </p>
        </div>
        <dl className="grid gap-0 border border-[var(--border)] text-sm">
          <div className="grid grid-cols-[8rem_1fr] border-b border-[var(--border)] px-4 py-3">
            <dt className="text-[var(--muted-foreground)]">Method</dt>
            <dd>Email and password</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] border-b border-[var(--border)] px-4 py-3">
            <dt className="text-[var(--muted-foreground)]">Destination</dt>
            <dd>Movies ledger</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] px-4 py-3">
            <dt className="text-[var(--muted-foreground)]">State</dt>
            <dd>Session persisted in Better Auth</dd>
          </div>
        </dl>
      </div>
      <SignInFormShell />
    </section>
  );
}
