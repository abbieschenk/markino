"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { LabelCountBarChart } from "@/components/charts/label-count-bar-chart";
import type { LabelCount } from "@/lib/movie-chart-stats";

type LabelCountPanelProps = {
  title: string;
  eyebrow: string;
  data: LabelCount[];
  emptyLabel: string;
};

export function LabelCountPanel({
  title,
  eyebrow,
  data,
  emptyLabel,
}: LabelCountPanelProps) {
  return (
    <ChartPanel title={title} eyebrow={eyebrow}>
      <LabelCountBarChart data={data} emptyLabel={emptyLabel} scrollable />
    </ChartPanel>
  );
}
