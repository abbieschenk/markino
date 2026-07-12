"use client";

import { useState } from "react";

import {
  MovieListTooltipPanel,
  PinnedMovieListTooltipOverlay,
  type PinnedMovieListTooltip,
} from "@/components/charts/movie-list-tooltip";
import type { GenreOverTimeCount } from "@/lib/movie-chart-stats";

type GenreOverTimeChartProps = {
  yearlyData: GenreOverTimeCount[];
};

type HeatmapCell = {
  key: string;
  genre: string;
  period: string;
  label: string;
  count: number;
  movies: string[];
};

type ActiveHeatmapCell = HeatmapCell & {
  x: number;
  y: number;
};

function getGenreLabels(data: GenreOverTimeCount[]) {
  const [firstItem] = data;

  if (!firstItem) {
    return [];
  }

  return Object.keys(firstItem.moviesByGenre);
}

function truncateGenreLabel(label: string) {
  return label.length > 18 ? `${label.slice(0, 17)}...` : label;
}

function shouldShowPeriodLabel(index: number, itemCount: number) {
  if (itemCount <= 12) {
    return true;
  }

  if (index === 0 || index === itemCount - 1) {
    return true;
  }

  return index % Math.ceil(itemCount / 8) === 0;
}

function getCellIntensity(count: number, maxCount: number) {
  if (count === 0 || maxCount === 0) {
    return 0;
  }

  return Math.round(18 + (count / maxCount) * 72);
}

export function GenreOverTimeChart({
  yearlyData,
}: GenreOverTimeChartProps) {
  const [activeCell, setActiveCell] = useState<ActiveHeatmapCell | null>(null);
  const [pinnedTooltip, setPinnedTooltip] =
    useState<PinnedMovieListTooltip | null>(null);
  const data = yearlyData;
  const genreLabels = getGenreLabels(data);
  const cells = genreLabels.flatMap((genre) =>
    data.map((period) => {
      const movies = period.moviesByGenre[genre] ?? [];

      return {
        key: `${genre}-${period.month}`,
        genre,
        period: period.month,
        label: period.label,
        count: movies.length,
        movies,
      };
    }),
  );
  const hasData = cells.some((cell) => cell.count > 0);
  const maxCount = Math.max(...cells.map((cell) => cell.count), 0);
  const gridTemplateColumns = `minmax(7rem, 8.5rem) repeat(${data.length}, minmax(1.75rem, 1fr)) minmax(2.75rem, 3.5rem)`;
  const hoverTooltip = activeCell
    ? {
        title: `${activeCell.genre} / ${activeCell.label}`,
        count: activeCell.count,
        movies: activeCell.movies,
        x: activeCell.x,
        y: activeCell.y,
      }
    : null;

  function activateCellFromPointer(
    cell: HeatmapCell,
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    const container = event.currentTarget.closest("[data-genre-heatmap]");
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
    const container = element.closest("[data-genre-heatmap]");
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

  return (
    <div className="relative grid gap-2">
      {hasData ? (
        <div className="relative" data-genre-heatmap>
          <div className="overflow-x-auto pb-1">
            <div
              className="grid min-w-max gap-px text-xs"
              style={{ gridTemplateColumns }}
            >
              <div aria-hidden="true" />
              {data.map((period, index) => (
                <div
                  key={period.month}
                  className="h-5 text-center font-mono text-[10px] leading-5 text-[var(--muted-foreground)] tabular-nums"
                >
                  {shouldShowPeriodLabel(index, data.length) ? period.label : ""}
                </div>
              ))}
              <div className="h-5 border-l border-[var(--border)] pl-1 text-center font-mono text-[10px] leading-5 text-[var(--muted-foreground)] tabular-nums">
                Total
              </div>

              {genreLabels.map((genre) => {
                const totalMovies = data.flatMap(
                  (period) => period.moviesByGenre[genre] ?? [],
                );
                const totalCount = totalMovies.length;
                const totalCell: HeatmapCell = {
                  key: `${genre}-total`,
                  genre,
                  period: "total",
                  label: "Total",
                  count: totalCount,
                  movies: totalMovies,
                };

                return (
                  <div key={genre} className="contents">
                    <div
                      className="h-7 truncate border-r border-[var(--border)] pr-2 text-xs leading-7"
                      title={genre}
                    >
                      {truncateGenreLabel(genre)}
                    </div>
                    {data.map((period) => {
                      const movies = period.moviesByGenre[genre] ?? [];
                      const count = movies.length;
                      const intensity = getCellIntensity(count, maxCount);
                      const cell: HeatmapCell = {
                        key: `${genre}-${period.month}`,
                        genre,
                        period: period.month,
                        label: period.label,
                        count,
                        movies,
                      };

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          className="flex h-7 min-w-7 items-center justify-center border border-[var(--border)] font-mono text-[10px] tabular-nums outline-none hover:border-[var(--foreground)] focus-visible:border-[var(--foreground)] focus-visible:ring-1 focus-visible:ring-[var(--foreground)] disabled:cursor-default disabled:hover:border-[var(--border)]"
                          style={{
                            backgroundColor:
                              intensity > 0
                                ? `color-mix(in oklch, var(--foreground) ${intensity}%, transparent)`
                                : undefined,
                            color:
                              intensity > 58 ? "var(--background)" : undefined,
                          }}
                          aria-label={`${genre}, ${period.label}: ${count} ${
                            count === 1 ? "movie" : "movies"
                          }`}
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
                          onClick={() => {
                            if (count === 0) {
                              return;
                            }

                            setPinnedTooltip({
                              key: cell.key,
                              title: `${genre} / ${period.label}`,
                              count,
                              movies,
                            });
                          }}
                        >
                          {count > 0 ? count : ""}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="flex h-7 min-w-11 items-center justify-center border border-[var(--border)] border-l-[var(--foreground)] font-mono text-[10px] font-medium tabular-nums outline-none hover:border-[var(--foreground)] focus-visible:border-[var(--foreground)] focus-visible:ring-1 focus-visible:ring-[var(--foreground)]"
                      aria-label={`${genre}, total: ${totalCount} ${
                        totalCount === 1 ? "movie" : "movies"
                      }`}
                      onPointerEnter={(event) =>
                        activateCellFromPointer(totalCell, event)
                      }
                      onPointerMove={(event) =>
                        activateCellFromPointer(totalCell, event)
                      }
                      onPointerLeave={() => setActiveCell(null)}
                      onFocus={(event) =>
                        activateCellFromElement(totalCell, event.currentTarget)
                      }
                      onBlur={() => setActiveCell(null)}
                      onClick={() => {
                        setPinnedTooltip({
                          key: totalCell.key,
                          title: `${genre} / Total`,
                          count: totalCount,
                          movies: totalMovies,
                        });
                      }}
                    >
                      {totalCount}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {hoverTooltip && !pinnedTooltip ? (
            <div
              className="pointer-events-none absolute z-10 max-w-[min(20rem,calc(100%-1rem))] -translate-y-[calc(100%+0.5rem)]"
              style={{
                left: `clamp(0.5rem, ${hoverTooltip.x}px, calc(100% - 20rem))`,
                top: hoverTooltip.y,
              }}
            >
              <MovieListTooltipPanel
                title={hoverTooltip.title}
                count={hoverTooltip.count}
                movies={hoverTooltip.movies}
                singularLabel="movie"
                pluralLabel="movies"
              />
            </div>
          ) : null}
          <PinnedMovieListTooltipOverlay
            tooltip={pinnedTooltip}
            singularLabel="movie"
            pluralLabel="movies"
            onClose={() => setPinnedTooltip(null)}
          />
        </div>
      ) : (
        <div className="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
          No genre metadata synced yet.
        </div>
      )}
    </div>
  );
}
