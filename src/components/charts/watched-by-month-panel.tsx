"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { WatchedByMonthChart } from "@/components/charts/watched-by-month-chart";
import type { WatchedByMonthCount } from "@/lib/movie-chart-stats";

type WatchedByMonthPanelProps = {
  data: WatchedByMonthCount[];
};

export function WatchedByMonthPanel({ data }: WatchedByMonthPanelProps) {
  return (
    <ChartPanel title="Watched by Month (%)">
      <WatchedByMonthChart data={data} />
    </ChartPanel>
  );
}
