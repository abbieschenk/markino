"use client";

import { X } from "@phosphor-icons/react";
import type { MouseHandlerDataParam } from "recharts";

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

export type MovieListTooltipPanelProps = {
  title?: string;
  count: number;
  movies: string[];
  singularLabel: string;
  pluralLabel: string;
  pinned?: boolean;
  onClose?: () => void;
};

export type PinnedMovieListTooltip = {
  key: string;
  title: string;
  count: number;
  movies: string[];
};

export function getActiveChartDataIndex(
  chartState: MouseHandlerDataParam,
  itemCount: number,
) {
  const index = Number(chartState.activeTooltipIndex);

  return Number.isInteger(index) && index >= 0 && index < itemCount
    ? index
    : null;
}

export function MovieListTooltipPanel({
  title,
  count,
  movies,
  singularLabel,
  pluralLabel,
  pinned = false,
  onClose,
}: MovieListTooltipPanelProps) {
  return (
    <div className="min-w-60 max-w-80 border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title ? <div className="font-medium">{title}</div> : null}
          <div className="mt-1 font-mono text-[var(--muted-foreground)] tabular-nums">
            {count.toLocaleString()} {count === 1 ? singularLabel : pluralLabel}
          </div>
        </div>
        {pinned && onClose ? (
          <button
            type="button"
            className="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center border border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
            aria-label="Close pinned tooltip"
            onClick={onClose}
          >
            <X className="size-3.5" weight="regular" />
          </button>
        ) : null}
      </div>
      {movies.length > 0 ? (
        <ul
          className="mt-2 grid max-h-80 gap-1 overflow-y-auto border-t border-[var(--border)] pt-2 pr-1 text-[var(--foreground)]"
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

type PinnedMovieListTooltipOverlayProps = {
  tooltip: PinnedMovieListTooltip | null;
  singularLabel: string;
  pluralLabel: string;
  onClose: () => void;
};

export function PinnedMovieListTooltipOverlay({
  tooltip,
  singularLabel,
  pluralLabel,
  onClose,
}: PinnedMovieListTooltipOverlayProps) {
  if (!tooltip) {
    return null;
  }

  return (
    <div className="absolute right-2 top-2 z-10 max-w-[calc(100%-1rem)]">
      <MovieListTooltipPanel
        key={tooltip.key}
        title={tooltip.title}
        count={tooltip.count}
        movies={tooltip.movies}
        singularLabel={singularLabel}
        pluralLabel={pluralLabel}
        pinned
        onClose={onClose}
      />
    </div>
  );
}

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
    <MovieListTooltipPanel
      title={title}
      count={count}
      movies={movies}
      singularLabel={singularLabel}
      pluralLabel={pluralLabel}
    />
  );
}
