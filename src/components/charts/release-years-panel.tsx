"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { ReleaseYearChart } from "@/components/charts/release-year-chart";
import type { LabelCount } from "@/lib/movie-chart-stats";

type ReleaseYearsPanelProps = {
  data: LabelCount[];
};

export function ReleaseYearsPanel({ data }: ReleaseYearsPanelProps) {
  return (
    <ChartPanel title="Release Years" contentClassName="mt-auto">
      <ReleaseYearChart data={data} />
    </ChartPanel>
  );
}
