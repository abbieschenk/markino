"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { MonthlyWatchedCount } from "@/lib/movie-chart-stats";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { MovieListTooltip } from "@/components/charts/movie-list-tooltip";

const chartConfig = {
  count: {
    label: "Watched",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

type WatchedOverTimeChartProps = {
  data: MonthlyWatchedCount[];
};

export function WatchedOverTimeChart({ data }: WatchedOverTimeChartProps) {
  const hasData = data.some((month) => month.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-[220px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
        No watched entries in the last 12 months.
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[220px] w-full aspect-auto"
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="2 4" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={1}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip
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
  );
}
