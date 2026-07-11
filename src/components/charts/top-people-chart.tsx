"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import type { LabelCount } from "@/lib/movie-chart-stats";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { MovieListTooltip } from "@/components/charts/movie-list-tooltip";

const chartConfig = {
  count: {
    label: "Movies",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

type TopPeopleChartProps = {
  data: LabelCount[];
  emptyLabel: string;
};

function truncateLabel(label: string) {
  return label.length > 18 ? `${label.slice(0, 17)}...` : label;
}

export function TopPeopleChart({ data, emptyLabel }: TopPeopleChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[300px] w-full aspect-auto"
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 28, left: 4, bottom: 0 }}
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
  );
}
