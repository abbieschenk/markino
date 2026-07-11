"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { MovieListTooltip } from "@/components/charts/movie-list-tooltip";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { LabelCount } from "@/lib/movie-chart-stats";

const chartConfig = {
  count: {
    label: "Movies",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

type ReleaseYearChartProps = {
  data: LabelCount[];
};

type ReleaseYearDatum = LabelCount & {
  year: number;
};

function getYearDomain(data: ReleaseYearDatum[]): [number, number] {
  const years = data.map((item) => item.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  if (minYear === maxYear) {
    return [minYear - 1, maxYear + 1];
  }

  return [minYear, maxYear];
}

export function ReleaseYearChart({ data }: ReleaseYearChartProps) {
  const chartData = data
    .map((item) => ({
      ...item,
      year: Number(item.label),
    }))
    .filter((item): item is ReleaseYearDatum => Number.isFinite(item.year));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
        No release year metadata synced yet.
      </div>
    );
  }

  const yearDomain = getYearDomain(chartData);

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[260px] w-full aspect-auto"
    >
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="2 4" />
        <XAxis
          dataKey="year"
          type="number"
          scale="linear"
          domain={yearDomain}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          tickFormatter={(year) => String(Math.round(Number(year)))}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip
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
          barSize={8}
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
