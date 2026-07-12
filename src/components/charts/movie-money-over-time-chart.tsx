"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import type { MovieMoneyOverTimeCount } from "@/lib/movie-chart-stats";
import { ChartPanel } from "@/components/charts/chart-panel";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  budget: {
    label: "Budget",
    color: "var(--chart-2)",
  },
  revenue: {
    label: "Revenue",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

type MovieMoneyOverTimeChartProps = {
  monthlyData: MovieMoneyOverTimeCount[];
  yearlyData: MovieMoneyOverTimeCount[];
  monthlyOmittedCount: number;
};

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function MovieMoneyOverTimeChart({
  monthlyData,
  yearlyData,
  monthlyOmittedCount,
}: MovieMoneyOverTimeChartProps) {
  const [mode, setMode] = useState<"monthly" | "yearly">("yearly");
  const data = mode === "monthly" ? monthlyData : yearlyData;
  const hasData = data.some((item) => item.budget > 0 || item.revenue > 0);
  const totalBudget = data.reduce((total, item) => total + item.budget, 0);
  const totalRevenue = data.reduce((total, item) => total + item.revenue, 0);

  return (
    <ChartPanel
      title="Budget / Revenue Over Time"
      eyebrow="USD"
      headerContent={
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[var(--muted-foreground)]">Budget </span>
              <span className="font-mono tabular-nums text-[var(--foreground)]">
                {formatCompactCurrency(totalBudget)}
              </span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Revenue </span>
              <span className="font-mono tabular-nums text-[var(--foreground)]">
                {formatCompactCurrency(totalRevenue)}
              </span>
            </div>
          </div>
          <div className="flex">
            <Button
              type="button"
              variant={mode === "monthly" ? "default" : "outline"}
              size="sm"
              className="h-7 rounded-none px-2 text-xs"
              onClick={() => setMode("monthly")}
            >
              Monthly
            </Button>
            <Button
              type="button"
              variant={mode === "yearly" ? "default" : "outline"}
              size="sm"
              className="h-7 rounded-none border-l-0 px-2 text-xs"
              onClick={() => setMode("yearly")}
            >
              Yearly
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-2">
        {mode === "monthly" && monthlyOmittedCount > 0 ? (
          <div className="text-xs text-[var(--muted-foreground)]">
            {monthlyOmittedCount} approximate{" "}
            {monthlyOmittedCount === 1 ? "entry" : "entries"} omitted
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <span className="h-0 w-5 border-t-2 border-[var(--chart-2)]" />
            Budget
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0 w-5 border-t-2 border-dashed border-[var(--chart-5)]" />
            Revenue
          </div>
        </div>

        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="h-[260px] w-full aspect-auto"
          >
            <LineChart
              data={data}
              margin={{ top: 8, right: 10, left: 8, bottom: 0 }}
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
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactCurrency}
                width={56}
              />
              <ChartTooltip
                cursor={false}
                isAnimationActive={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{
                            backgroundColor:
                              name === "budget"
                                ? "var(--color-budget)"
                                : "var(--color-revenue)",
                          }}
                        />
                        <span className="text-[var(--muted-foreground)]">
                          {name === "budget" ? "Budget" : "Revenue"}
                        </span>
                        <span className="ml-auto font-mono font-medium tabular-nums text-[var(--foreground)]">
                          {typeof value === "number"
                            ? formatCurrency(value)
                            : String(value)}
                        </span>
                      </>
                    )}
                    labelFormatter={(_, payload) => {
                      const item = payload[0]?.payload as
                        | MovieMoneyOverTimeCount
                        | undefined;

                      return item
                        ? `${item.label} / ${item.movieCount} ${
                            item.movieCount === 1 ? "movie" : "movies"
                          }`
                        : null;
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="budget"
                stroke="var(--color-budget)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
            No budget or revenue metadata synced yet.
          </div>
        )}
      </div>
    </ChartPanel>
  );
}
