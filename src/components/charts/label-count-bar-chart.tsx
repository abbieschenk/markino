"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import {
  getActiveChartDataIndex,
  MovieListTooltip,
  PinnedMovieListTooltipOverlay,
  type PinnedMovieListTooltip,
} from "@/components/charts/movie-list-tooltip";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { LabelCount } from "@/lib/movie-chart-stats";

const chartConfig = {
  count: {
    label: "Movies",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

type LabelCountBarChartProps = {
  data: LabelCount[];
  emptyLabel: string;
  scrollable?: boolean;
};

function truncateLabel(label: string) {
  return label.length > 18 ? `${label.slice(0, 17)}...` : label;
}

export function LabelCountBarChart({
  data,
  emptyLabel,
  scrollable = false,
}: LabelCountBarChartProps) {
  const [pinnedTooltip, setPinnedTooltip] =
    useState<PinnedMovieListTooltip | null>(null);
  const chartHeight = scrollable ? Math.max(300, data.length * 28) : 300;

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={
          scrollable
            ? "h-[300px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : undefined
        }
      >
        <ChartContainer
          config={chartConfig}
          className="w-full aspect-auto"
          style={{ height: chartHeight }}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 28, left: 4, bottom: 0 }}
            onClick={(chartState) => {
              const index = getActiveChartDataIndex(chartState, data.length);

              if (index == null) {
                return;
              }

              const item = data[index];
              setPinnedTooltip({
                key: item.label,
                title: item.label,
                count: item.count,
                movies: item.movies,
              });
            }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="2 4" />
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={118}
              tickFormatter={truncateLabel}
            />
            <ChartTooltip
              active={pinnedTooltip ? false : undefined}
              cursor={false}
              isAnimationActive={false}
              content={
                <MovieListTooltip singularLabel="movie" pluralLabel="movies" />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              isAnimationActive={false}
              radius={2}
            >
              <LabelList
                dataKey="count"
                position="right"
                className="fill-[var(--foreground)] text-xs tabular-nums"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      <PinnedMovieListTooltipOverlay
        tooltip={pinnedTooltip}
        singularLabel="movie"
        pluralLabel="movies"
        onClose={() => setPinnedTooltip(null)}
      />
    </div>
  );
}
