export function AuthFormLoading({ title }: { title: string }) {
  return (
    <div className="grid gap-0 border border-[var(--border)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          {title}
        </p>
      </div>
      <div className="px-4 py-6 text-sm text-[var(--muted-foreground)]">
        Loading form...
      </div>
    </div>
  );
}
