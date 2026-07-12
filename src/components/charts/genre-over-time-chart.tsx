"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { GenreOverTimeCount } from "@/lib/movie-chart-stats";

const chartColors = [
  "var(--chart-5)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-1)",
];

type GenreOverTimeChartProps = {
  data: GenreOverTimeCount[];
};

function getGenreLabels(data: GenreOverTimeCount[]) {
  const [firstItem] = data;

  if (!firstItem) {
    return [];
  }

  return Object.keys(firstItem.moviesByGenre);
}

export function GenreOverTimeChart({ data }: GenreOverTimeChartProps) {
  const genreLabels = getGenreLabels(data);
  const genreSeries = genreLabels.map((label, index) => ({
    key: `genre${index}`,
    label,
    color: chartColors[index % chartColors.length],
  }));
  const hasData = data.some((month) =>
    genreLabels.some((genre) => Number(month[genre]) > 0),
  );

  if (!hasData) {
    return (
      <div className="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
        No genre metadata synced yet.
      </div>
    );
  }

  const chartConfig = Object.fromEntries(
    genreSeries.map((genre) => [
      genre.key,
      {
        label: genre.label,
        color: genre.color,
      },
    ]),
  ) satisfies ChartConfig;
  const chartData = data.map((month) => {
    const item: Record<string, string | number> = {
      month: month.month,
      label: month.label,
    };

    for (const genre of genreSeries) {
      item[genre.key] = Number(month[genre.label]) || 0;
    }

    return item;
  });

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[260px] w-full aspect-auto"
    >
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 10, left: -24, bottom: 0 }}
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
          cursor={false}
          isAnimationActive={false}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_, payload) => payload[0]?.payload?.label}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {genreSeries.map((genre, index) => (
          <Line
            key={genre.key}
            type="linear"
            dataKey={genre.key}
            stroke={`var(--color-${genre.key})`}
            strokeWidth={index === 0 ? 2 : 1.5}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
