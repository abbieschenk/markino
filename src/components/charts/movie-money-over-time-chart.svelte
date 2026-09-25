<script lang="ts">
  import type { MovieMoneyOverTimeCount } from "@/lib/movie-chart-stats";
  import {
    formatCompactCurrency,
    formatCurrency,
    getLinearTicks,
    getPath,
    shouldShowXAxisLabel,
    type ChartPoint,
    type MoneyDatum,
  } from "./static-chart-utils";

  export let monthlyData: MovieMoneyOverTimeCount[] = [];
  export let yearlyData: MovieMoneyOverTimeCount[] = [];
  export let monthlyOmittedCount = 0;

  let mode: "monthly" | "yearly" = "yearly";
  let pinned: MoneyDatum | null = null;

  const width = 640;
  const height = 260;
  const margin = { top: 8, right: 12, bottom: 30, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  $: data = (mode === "monthly" ? monthlyData : yearlyData).map((item) => ({
    key: item.period,
    label: item.label,
    budget: item.budget,
    revenue: item.revenue,
    movieCount: item.movieCount,
  }));
  $: hasData = data.some((item) => item.budget > 0 || item.revenue > 0);
  $: totalBudget = data.reduce((total, item) => total + item.budget, 0);
  $: totalRevenue = data.reduce((total, item) => total + item.revenue, 0);
  $: maxValue = Math.max(...data.flatMap((item) => [item.budget, item.revenue]), 0);
  $: ticks = getLinearTicks(maxValue);
  $: yMax = ticks.at(-1) ?? 1;
  $: stepWidth = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;

  function point(item: MoneyDatum, index: number, key: "budget" | "revenue"): ChartPoint {
    const x = margin.left + (data.length > 1 ? index * stepWidth : plotWidth / 2);
    const y = margin.top + plotHeight - (yMax > 0 ? (item[key] / yMax) * plotHeight : 0);

    return { x, y };
  }

  function pinOnKeydown(event: KeyboardEvent, item: MoneyDatum) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pinned = item;
    }
  }

  $: budgetPath = getPath(data.map((item, index) => point(item, index, "budget")));
  $: revenuePath = getPath(data.map((item, index) => point(item, index, "revenue")));
</script>

<section class="flex flex-col border border-[var(--border)] bg-[var(--card)] p-4">
  <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-baseline gap-3">
      <h2 class="text-sm font-medium">Budget / Revenue Over Time</h2>
      <p class="text-xs tabular-nums text-[var(--muted-foreground)]">USD</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span class="text-[var(--muted-foreground)]">Budget </span>
          <span class="font-mono tabular-nums text-[var(--foreground)]">{formatCompactCurrency(totalBudget)}</span>
        </div>
        <div>
          <span class="text-[var(--muted-foreground)]">Revenue </span>
          <span class="font-mono tabular-nums text-[var(--foreground)]">{formatCompactCurrency(totalRevenue)}</span>
        </div>
      </div>
      <div class="flex">
        <button type="button" class={`h-7 border px-2 text-xs ${mode === "monthly" ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--background)]"}`} on:click={() => (mode = "monthly")}>Monthly</button>
        <button type="button" class={`h-7 border border-l-0 px-2 text-xs ${mode === "yearly" ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--background)]"}`} on:click={() => (mode = "yearly")}>Yearly</button>
      </div>
    </div>
  </div>

  <div class="grid gap-2">

  {#if mode === "monthly" && monthlyOmittedCount > 0}
    <div class="text-xs text-[var(--muted-foreground)]">
      {monthlyOmittedCount} approximate {monthlyOmittedCount === 1 ? "entry" : "entries"} omitted
    </div>
  {/if}

  <div class="flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
    <div class="flex items-center gap-1.5"><span class="h-0 w-5 border-t-2 border-[var(--chart-2)]"></span>Budget</div>
    <div class="flex items-center gap-1.5"><span class="h-0 w-5 border-t-2 border-dashed border-[var(--chart-5)]"></span>Revenue</div>
  </div>

  {#if hasData}
    <div class="relative">
      <svg class="h-[260px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Budget and revenue over time chart" preserveAspectRatio="none">
        {#each ticks as tick}
          {@const y = margin.top + plotHeight - (yMax > 0 ? (tick / yMax) * plotHeight : 0)}
          <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="var(--border)" stroke-dasharray="2 4" />
          <text x={margin.left - 8} y={y + 4} text-anchor="end" class="fill-[var(--muted-foreground)] text-[10px] tabular-nums">{formatCompactCurrency(tick)}</text>
        {/each}
        <path d={budgetPath} fill="none" stroke="var(--chart-2)" stroke-width="2" vector-effect="non-scaling-stroke" />
        <path d={revenuePath} fill="none" stroke="var(--chart-5)" stroke-width="2" stroke-dasharray="4 3" vector-effect="non-scaling-stroke" />
        {#each data as item, index}
          {@const budgetPoint = point(item, index, "budget")}
          {@const revenuePoint = point(item, index, "revenue")}
          <g>
            <title>{item.label}: Budget {formatCurrency(item.budget)}, Revenue {formatCurrency(item.revenue)}</title>
            <circle cx={budgetPoint.x} cy={budgetPoint.y} r="5" fill="transparent" class="cursor-pointer" role="button" tabindex="0" aria-label={`${item.label} budget ${formatCurrency(item.budget)}`} on:click={() => (pinned = item)} on:keydown={(event) => pinOnKeydown(event, item)} />
            <circle cx={revenuePoint.x} cy={revenuePoint.y} r="5" fill="transparent" class="cursor-pointer" role="button" tabindex="0" aria-label={`${item.label} revenue ${formatCurrency(item.revenue)}`} on:click={() => (pinned = item)} on:keydown={(event) => pinOnKeydown(event, item)} />
          </g>
          {#if shouldShowXAxisLabel(index, data.length)}
            <text x={budgetPoint.x} y={height - 8} text-anchor="middle" class="fill-[var(--muted-foreground)] text-[10px] tabular-nums">{item.label}</text>
          {/if}
        {/each}
      </svg>
      {#if pinned}
        <div class="absolute right-2 top-2 z-10 min-w-60 max-w-80 border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs shadow-lg">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-medium">{pinned.label} / {pinned.movieCount} {pinned.movieCount === 1 ? "movie" : "movies"}</div>
              <div class="mt-2 grid gap-1 font-mono tabular-nums">
                <div>Budget {formatCurrency(pinned.budget)}</div>
                <div>Revenue {formatCurrency(pinned.revenue)}</div>
              </div>
            </div>
            <button type="button" class="-mr-1 -mt-1 h-7 w-7 border border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]" aria-label="Close pinned tooltip" on:click={() => (pinned = null)}>x</button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
      No budget or revenue metadata synced yet.
    </div>
  {/if}
  </div>
</section>
