"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { MonthlyWatchedCount } from "@/lib/movie-chart-stats";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  getActiveChartDataIndex,
  MovieListTooltip,
  PinnedMovieListTooltipOverlay,
  type PinnedMovieListTooltip,
} from "@/components/charts/movie-list-tooltip";

const chartConfig = {
  count: {
    label: "Watched",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

type WatchedOverTimeChartProps = {
  data: MonthlyWatchedCount[];
};

export function WatchedOverTimeChart({ data }: WatchedOverTimeChartProps) {
  const [pinnedTooltip, setPinnedTooltip] =
    useState<PinnedMovieListTooltip | null>(null);
  const hasData = data.some((month) => month.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
        No watched entries yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <ChartContainer
        config={chartConfig}
        className="h-[260px] w-full aspect-auto"
      >
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
          onClick={(chartState) => {
            const index = getActiveChartDataIndex(chartState, data.length);

            if (index == null) {
              return;
            }

            const item = data[index];
            setPinnedTooltip({
              key: item.month,
              title: item.label,
              count: item.count,
              movies: item.movies,
            });
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="2 4" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <ChartTooltip
            active={pinnedTooltip ? false : undefined}
            cursor={false}
            isAnimationActive={false}
            content={
              <MovieListTooltip
                singularLabel="movie watched"
                pluralLabel="movies watched"
              />
            }
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            isAnimationActive={false}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <PinnedMovieListTooltipOverlay
        tooltip={pinnedTooltip}
        singularLabel="movie watched"
        pluralLabel="movies watched"
        onClose={() => setPinnedTooltip(null)}
      />
    </div>
  );
}
