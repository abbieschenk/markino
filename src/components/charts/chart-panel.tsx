import type { ReactNode } from "react";

type ChartPanelProps = {
  title: string;
  eyebrow?: string;
  headerContent?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
};

export function ChartPanel({
  title,
  eyebrow,
  headerContent,
  contentClassName,
  children,
}: ChartPanelProps) {
  return (
    <section className="flex flex-col border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-medium">{title}</h2>
          {eyebrow ? (
            <p className="text-xs tabular-nums text-[var(--muted-foreground)]">
              {eyebrow}
            </p>
          ) : null}
        </div>
        {headerContent}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
