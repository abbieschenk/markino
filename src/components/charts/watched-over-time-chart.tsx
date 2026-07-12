"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type {
  MonthlyWatchedCount,
  YearlyWatchedCount,
} from "@/lib/movie-chart-stats";
import { ChartPanel } from "@/components/charts/chart-panel";
import { Button } from "@/components/ui/button";
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
  monthlyData: MonthlyWatchedCount[];
  yearlyData: YearlyWatchedCount[];
  monthlyOmittedCount: number;
};

export function WatchedOverTimeChart({
  monthlyData,
  yearlyData,
  monthlyOmittedCount,
}: WatchedOverTimeChartProps) {
  const [mode, setMode] = useState<"monthly" | "yearly">("yearly");
  const [pinnedTooltip, setPinnedTooltip] =
    useState<PinnedMovieListTooltip | null>(null);
  const data = mode === "monthly" ? monthlyData : yearlyData;
  const chartData = data.map((item) => ({
    period: "month" in item ? item.month : item.year,
    label: item.label,
    count: item.count,
    movies: item.movies,
  }));
  const hasData = chartData.some((item) => item.count > 0);
  const watchedCount = chartData.reduce((total, item) => total + item.count, 0);

  return (
    <ChartPanel
      title="Watched Over Time"
      eyebrow="All time"
      headerContent={
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs">
            <span className="text-[var(--muted-foreground)]">Watched </span>
            <span className="font-mono tabular-nums text-[var(--foreground)]">
              {watchedCount.toLocaleString()}
            </span>
          </div>
          <div className="flex">
            <Button
              type="button"
              variant={mode === "monthly" ? "default" : "outline"}
              size="sm"
              className="h-7 rounded-none px-2 text-xs"
              onClick={() => {
                setMode("monthly");
                setPinnedTooltip(null);
              }}
            >
              Monthly
            </Button>
            <Button
              type="button"
              variant={mode === "yearly" ? "default" : "outline"}
              size="sm"
              className="h-7 rounded-none border-l-0 px-2 text-xs"
              onClick={() => {
                setMode("yearly");
                setPinnedTooltip(null);
              }}
            >
              Yearly
            </Button>
          </div>
        </div>
      }
    >
      <div className="relative grid gap-2">
        {mode === "monthly" && monthlyOmittedCount > 0 ? (
          <div className="text-xs text-[var(--muted-foreground)]">
            {monthlyOmittedCount} approximate{" "}
            {monthlyOmittedCount === 1 ? "entry" : "entries"} omitted
          </div>
        ) : null}
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="h-[260px] w-full aspect-auto"
          >
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
              onClick={(chartState) => {
                const index = getActiveChartDataIndex(
                  chartState,
                  chartData.length,
                );

                if (index == null) {
                  return;
                }

                const item = chartData[index];
                setPinnedTooltip({
                  key: item.period,
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
        ) : (
          <div className="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
            No watched entries yet.
          </div>
        )}
        {hasData ? (
          <PinnedMovieListTooltipOverlay
            tooltip={pinnedTooltip}
            singularLabel="movie watched"
            pluralLabel="movies watched"
            onClose={() => setPinnedTooltip(null)}
          />
        ) : null}
      </div>
    </ChartPanel>
  );
}
