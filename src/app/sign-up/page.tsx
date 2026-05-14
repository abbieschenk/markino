import { SignUpFormShell } from "@/components/auth/SignUpFormShell";

export default function SignUpPage() {
  return (
    <section className="grid gap-8 py-12 lg:grid-cols-[minmax(0,20rem)_minmax(24rem,34rem)] lg:justify-between">
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            New Ledger
          </p>
          <h1 className="text-3xl leading-tight font-medium tracking-[-0.04em] sm:text-4xl">
            Set the handle once. Keep the table dense.
          </h1>
          <p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Your handle is how other people tag you on shared watches. Create
            the account with the name you want displayed in the ledger and the
            handle you want attached to entries.
          </p>
        </div>
        <dl className="grid gap-0 border border-[var(--border)] text-sm">
          <div className="grid grid-cols-[8rem_1fr] border-b border-[var(--border)] px-4 py-3">
            <dt className="text-[var(--muted-foreground)]">Account</dt>
            <dd>Email and password</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] border-b border-[var(--border)] px-4 py-3">
            <dt className="text-[var(--muted-foreground)]">Identity</dt>
            <dd>Name plus stable handle</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] px-4 py-3">
            <dt className="text-[var(--muted-foreground)]">Next</dt>
            <dd>Auto sign-in to the movie ledger</dd>
          </div>
        </dl>
      </div>
      <SignUpFormShell />
    </section>
  );
}
