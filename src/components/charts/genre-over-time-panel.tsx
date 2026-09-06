"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { GenreOverTimeChart } from "@/components/charts/genre-over-time-chart";
import type { GenreOverTimeCount } from "@/lib/movie-chart-stats";

type GenreOverTimePanelProps = {
  yearlyData: GenreOverTimeCount[];
};

export function GenreOverTimePanel({ yearlyData }: GenreOverTimePanelProps) {
  return (
    <ChartPanel title="Genres Over Time">
      <GenreOverTimeChart yearlyData={yearlyData} />
    </ChartPanel>
  );
}
