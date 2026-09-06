"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { GenreOverTimeChart } from "@/components/charts/genre-over-time-chart";
import { LabelCountBarChart } from "@/components/charts/label-count-bar-chart";
import { MovieMoneyOverTimeChart } from "@/components/charts/movie-money-over-time-chart";
import { ReleaseYearChart } from "@/components/charts/release-year-chart";
import { WatchedByMonthChart } from "@/components/charts/watched-by-month-chart";
import { WatchedOverTimeChart } from "@/components/charts/watched-over-time-chart";
import type { MovieChartStats } from "@/lib/movie-chart-stats";

type ChartsScreenIslandProps = {
  stats: MovieChartStats;
};

export function ChartsScreenIsland({ stats }: ChartsScreenIslandProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <WatchedOverTimeChart
        monthlyData={stats.monthlyWatched}
        yearlyData={stats.yearlyWatched}
        monthlyOmittedCount={stats.yearOnlyWatchedOmittedFromMonthly}
      />

      <ChartPanel title="Watched by Month (%)">
        <WatchedByMonthChart data={stats.watchedByMonth} />
      </ChartPanel>

      <MovieMoneyOverTimeChart
        monthlyData={stats.monthlyMoneyOverTime}
        yearlyData={stats.yearlyMoneyOverTime}
        monthlyOmittedCount={stats.yearOnlyWatchedOmittedFromMonthly}
      />

      <ChartPanel title="Release Years" contentClassName="mt-auto">
        <ReleaseYearChart data={stats.releaseYears} />
      </ChartPanel>

      <ChartPanel title="Genres Over Time">
        <GenreOverTimeChart yearlyData={stats.yearlyGenreOverTime} />
      </ChartPanel>

      <ChartPanel title="Top Directors" eyebrow="Top 20">
        <LabelCountBarChart
          data={stats.topDirectors}
          emptyLabel="No director metadata synced yet."
          scrollable
        />
      </ChartPanel>

      <ChartPanel title="Top Actors" eyebrow="Top-billed cast, top 20">
        <LabelCountBarChart
          data={stats.topActors}
          emptyLabel="No cast metadata synced yet."
          scrollable
        />
      </ChartPanel>
    </div>
  );
}
