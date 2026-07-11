"use client";

import { cn } from "@/lib/utils";

type MovieTooltipPayload = {
  value?: number | string;
  payload?: {
    label?: string;
    movies?: string[];
  };
};

type MovieListTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: MovieTooltipPayload[];
  singularLabel: string;
  pluralLabel: string;
};

export function MovieListTooltip({
  active,
  label,
  payload,
  singularLabel,
  pluralLabel,
}: MovieListTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const [item] = payload;
  const movies = item.payload?.movies ?? [];
  const count =
    typeof item.value === "number" ? item.value : Number(item.value ?? movies.length);
  const title = item.payload?.label ?? label;

  return (
    <div className="min-w-56 max-w-72 border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs shadow-lg">
      {title ? <div className="font-medium">{title}</div> : null}
      <div className="mt-1 font-mono text-[var(--muted-foreground)] tabular-nums">
        {count.toLocaleString()} {count === 1 ? singularLabel : pluralLabel}
      </div>
      {movies.length > 0 ? (
        <ul
          className={cn(
            "mt-2 grid max-h-52 gap-1 overflow-y-auto pr-1 text-[var(--foreground)]",
            movies.length > 8 && "border-t border-[var(--border)] pt-2",
          )}
        >
          {movies.map((movie, index) => (
            <li key={`${movie}-${index}`} className="leading-snug">
              {movie}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
