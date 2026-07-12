"use client";

import { useState } from "react";

import type { WatchedByMonthCount } from "@/lib/movie-chart-stats";

type WatchedByMonthChartProps = {
  data: WatchedByMonthCount[];
};

type HeatmapCell = {
  key: string;
  year: string;
  month: string;
  label: string;
  count: number;
  total: number;
  percentage: number;
  movies: string[];
};

type ActiveHeatmapCell = HeatmapCell & {
  x: number;
  y: number;
};

function getWatchedYears(data: WatchedByMonthCount[]) {
  const [firstItem] = data;

  if (!firstItem) {
    return [];
  }

  return Object.keys(firstItem.moviesByYear).sort((left, right) =>
    right.localeCompare(left),
  );
}

function formatPercentage(value: number) {
  return value > 0 && value < 1 ? "<1%" : `${Math.round(value)}%`;
}

function getCellIntensity(percentage: number, maxPercentage: number) {
  if (percentage === 0 || maxPercentage === 0) {
    return 0;
  }

  return Math.round(14 + (percentage / maxPercentage) * 74);
}

function isUpcomingMonth(year: string, month: string) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const yearNumber = Number(year);
  const monthNumber = Number(month);

  return (
    Number.isFinite(yearNumber) &&
    Number.isFinite(monthNumber) &&
    (yearNumber > currentYear ||
      (yearNumber === currentYear && monthNumber > currentMonth))
  );
}

export function WatchedByMonthChart({ data }: WatchedByMonthChartProps) {
  const [activeCell, setActiveCell] = useState<ActiveHeatmapCell | null>(null);
  const years = getWatchedYears(data);
  const totalsByYear = new Map(
    years.map((year) => [
      year,
      data.reduce((sum, month) => sum + (Number(month[year]) || 0), 0),
    ]),
  );
  const cells = years.flatMap((year) =>
    data.map((month) => {
      const count = Number(month[year]) || 0;
      const total = totalsByYear.get(year) ?? 0;
      const percentage = total > 0 ? (count / total) * 100 : 0;

      return {
        key: `${year}-${month.month}`,
        year,
        month: month.month,
        label: month.label,
        count,
        total,
        percentage,
        movies: month.moviesByYear[year] ?? [],
      };
    }),
  );
  const hasData = cells.some((cell) => cell.count > 0);
  const maxPercentage = Math.max(...cells.map((cell) => cell.percentage), 0);
  const gridTemplateColumns = `max-content 0.375rem repeat(${data.length}, 1.75rem) minmax(3rem, 3.5rem)`;

  function activateCellFromPointer(
    cell: HeatmapCell,
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    const container = event.currentTarget.closest("[data-watched-month-heatmap]");
    const containerRect = container?.getBoundingClientRect();

    setActiveCell({
      ...cell,
      x: containerRect ? event.clientX - containerRect.left : 0,
      y: containerRect ? event.clientY - containerRect.top : 0,
    });
  }

  function activateCellFromElement(
    cell: HeatmapCell,
    element: HTMLButtonElement,
  ) {
    const container = element.closest("[data-watched-month-heatmap]");
    const containerRect = container?.getBoundingClientRect();
    const cellRect = element.getBoundingClientRect();

    setActiveCell({
      ...cell,
      x: containerRect
        ? cellRect.left - containerRect.left + cellRect.width / 2
        : 0,
      y: containerRect ? cellRect.top - containerRect.top : 0,
    });
  }

  if (!hasData) {
    return (
      <div className="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
        No exact-date watched entries yet.
      </div>
    );
  }

  return (
    <div className="relative" data-watched-month-heatmap>
      <div className="overflow-x-auto pb-1">
        <div
          className="grid min-w-max text-xs"
          style={{ gridTemplateColumns }}
        >
          <div aria-hidden="true" />
          <div aria-hidden="true" />
          {data.map((month) => (
            <div
              key={month.month}
              className="ml-px h-5 text-center font-mono text-[10px] leading-5 text-[var(--muted-foreground)] tabular-nums"
            >
              {month.label}
            </div>
          ))}
          <div className="ml-px h-5 border-l border-[var(--border)] pl-1 text-center font-mono text-[10px] leading-5 text-[var(--muted-foreground)] tabular-nums">
            Total
          </div>

          {years.map((year) => (
            <div key={year} className="contents">
              <div className="h-7 font-mono text-xs leading-7 tabular-nums">
                {year}
              </div>
              <div aria-hidden="true" />
              {data.map((month) => {
                const count = Number(month[year]) || 0;
                const total = totalsByYear.get(year) ?? 0;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const isUpcoming = isUpcomingMonth(year, month.month);
                const intensity = getCellIntensity(percentage, maxPercentage);
                const cell: HeatmapCell = {
                  key: `${year}-${month.month}`,
                  year,
                  month: month.month,
                  label: month.label,
                  count,
                  total,
                  percentage,
                  movies: month.moviesByYear[year] ?? [],
                };

                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`ml-px flex h-7 w-7 items-center justify-center border outline-none hover:border-[var(--foreground)] focus-visible:border-[var(--foreground)] focus-visible:ring-1 focus-visible:ring-[var(--foreground)] disabled:cursor-default ${
                      isUpcoming
                        ? "border-transparent disabled:hover:border-transparent"
                        : "border-[var(--border)] disabled:hover:border-[var(--border)]"
                    }`}
                    style={{
                      backgroundColor:
                        intensity > 0 && !isUpcoming
                          ? `color-mix(in oklch, var(--foreground) ${intensity}%, transparent)`
                          : undefined,
                      color:
                        intensity > 58 && !isUpcoming
                          ? "var(--background)"
                          : undefined,
                    }}
                    aria-label={`${year}, ${month.label}: ${formatPercentage(
                      percentage,
                    )} of yearly watches`}
                    disabled={count === 0}
                    onPointerEnter={(event) =>
                      activateCellFromPointer(cell, event)
                    }
                    onPointerMove={(event) =>
                      activateCellFromPointer(cell, event)
                    }
                    onPointerLeave={() => setActiveCell(null)}
                    onFocus={(event) =>
                      activateCellFromElement(cell, event.currentTarget)
                    }
                    onBlur={() => setActiveCell(null)}
                  >
                    <span className="sr-only">
                      {count > 0 ? formatPercentage(percentage) : "0%"}
                    </span>
                  </button>
                );
              })}
              <div className="ml-px flex h-7 min-w-12 items-center justify-center border border-[var(--border)] border-l-[var(--foreground)] font-mono text-[10px] font-medium tabular-nums">
                {totalsByYear.get(year) ?? 0}
              </div>
            </div>
          ))}
        </div>
      </div>
      {activeCell ? (
        <div
          className="pointer-events-none absolute z-10 max-w-[min(20rem,calc(100%-1rem))] -translate-y-[calc(100%+0.5rem)]"
          style={{
            left: `clamp(0.5rem, ${activeCell.x}px, calc(100% - 20rem))`,
            top: activeCell.y,
          }}
        >
          <div className="min-w-48 border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs shadow-lg">
            <div className="font-medium">
              {activeCell.year} / {activeCell.label}
            </div>
            <div className="mt-1 font-mono text-[var(--muted-foreground)] tabular-nums">
              {formatPercentage(activeCell.percentage)} of{" "}
              {activeCell.total.toLocaleString()} yearly watches
            </div>
            <div className="mt-2 border-t border-[var(--border)] pt-2 font-mono tabular-nums">
              {activeCell.count.toLocaleString()}{" "}
              {activeCell.count === 1 ? "movie" : "movies"}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
