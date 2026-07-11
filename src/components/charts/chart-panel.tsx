import type { ReactNode } from "react";

type ChartPanelProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function ChartPanel({ title, eyebrow, children }: ChartPanelProps) {
  return (
    <section className="border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {eyebrow ? (
          <p className="text-xs tabular-nums text-[var(--muted-foreground)]">
            {eyebrow}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
