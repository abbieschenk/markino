import Link from "next/link";

export default function Home() {
  return (
    <section className="grid gap-8 py-12 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Movie Ledger
          </p>
          <h1 className="max-w-3xl text-3xl leading-tight font-medium tracking-[-0.04em] sm:text-5xl">
            Quiet ranking for people who want the table first.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
            Markino is a dense watch log for personal and collaborative movie
            tracking. Keep dates, languages, status, and shared watches in one
            restrained ledger.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/movies"
            className="inline-flex h-9 items-center border border-[var(--border)] px-3 font-medium hover:bg-[var(--accent)]"
          >
            Open Ledger
          </Link>
          <Link
            href="/settings"
            className="inline-flex h-9 items-center border border-transparent px-3 text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
          >
            Settings
          </Link>
        </div>
      </div>
      <aside className="border border-[var(--border)]">
        <div className="border-b border-[var(--border)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          Default View
        </div>
        <dl className="grid gap-0 text-sm">
          <div className="grid grid-cols-[8rem_1fr] border-b border-[var(--border)] px-4 py-3">
            <dt className="text-[var(--muted-foreground)]">Mode</dt>
            <dd>Dense table</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] border-b border-[var(--border)] px-4 py-3">
            <dt className="text-[var(--muted-foreground)]">Sorting</dt>
            <dd>Manual preference order</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] border-b border-[var(--border)] px-4 py-3">
            <dt className="text-[var(--muted-foreground)]">Scope</dt>
            <dd>Personal and shared watches</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] px-4 py-3">
            <dt className="text-[var(--muted-foreground)]">State</dt>
            <dd>Mock data only</dd>
          </div>
        </dl>
      </aside>
    </section>
  );
}
