import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ChartPanel } from "@/components/charts/chart-panel";
import { GenreOverTimeChart } from "@/components/charts/genre-over-time-chart";
import { LabelCountBarChart } from "@/components/charts/label-count-bar-chart";
import { ReleaseYearChart } from "@/components/charts/release-year-chart";
import { WatchedOverTimeChart } from "@/components/charts/watched-over-time-chart";
import { auth } from "@/lib/auth";
import { getMovieChartStatsForUser } from "@/lib/movie-chart-stats";

export const metadata: Metadata = {
  title: "Charts",
};

export default async function ChartsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const stats = await getMovieChartStatsForUser(session.user.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <h1 className="text-base font-medium">Charts</h1>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Watched Over Time" eyebrow="All time">
          <WatchedOverTimeChart
            monthlyData={stats.monthlyWatched}
            yearlyData={stats.yearlyWatched}
            monthlyOmittedCount={stats.yearOnlyWatchedOmittedFromMonthly}
          />
        </ChartPanel>

        <ChartPanel title="Release Years">
          <ReleaseYearChart data={stats.releaseYears} />
        </ChartPanel>

        <ChartPanel title="Top Genres" eyebrow="Top 10">
          <LabelCountBarChart
            data={stats.topGenres}
            emptyLabel="No genre metadata synced yet."
          />
        </ChartPanel>

        <ChartPanel title="Genres Over Time" eyebrow="Top 5 genres">
          <GenreOverTimeChart
            monthlyData={stats.monthlyGenreOverTime}
            yearlyData={stats.yearlyGenreOverTime}
          />
        </ChartPanel>

        <ChartPanel title="Top Directors" eyebrow="Top 10">
          <LabelCountBarChart
            data={stats.topDirectors}
            emptyLabel="No director metadata synced yet."
          />
        </ChartPanel>

        <ChartPanel title="Top Actors" eyebrow="Top-billed cast, top 10">
          <LabelCountBarChart
            data={stats.topActors}
            emptyLabel="No cast metadata synced yet."
          />
        </ChartPanel>
      </div>
    </div>
  );
}
