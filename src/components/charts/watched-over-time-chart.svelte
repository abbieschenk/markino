<script lang="ts">
  import type { MonthlyWatchedCount, YearlyWatchedCount } from "@/lib/movie-chart-stats";
  import MovieTooltipPanel from "./movie-tooltip-panel.svelte";
  import { getLinearTicks, getRoundedBarPath, shouldShowXAxisLabel, type MovieCountDatum } from "./static-chart-utils";

  export let monthlyData: MonthlyWatchedCount[] = [];
  export let yearlyData: YearlyWatchedCount[] = [];
  export let monthlyOmittedCount = 0;

  let mode: "monthly" | "yearly" = "yearly";
  let pinned: MovieCountDatum | null = null;
  let hoverTooltip: (MovieCountDatum & { x: number; y: number }) | null = null;
  let container: HTMLDivElement;

  const width = 640;
  const height = 260;
  const margin = { top: 8, right: 8, bottom: 30, left: 34 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  $: data = (mode === "monthly" ? monthlyData : yearlyData).map((item) => ({
    key: "month" in item ? item.month : item.year,
    label: item.label,
    count: item.count,
    movies: item.movies,
  }));
  $: hasData = data.some((item) => item.count > 0);
  $: watchedCount = data.reduce((total, item) => total + item.count, 0);
  $: maxCount = Math.max(...data.map((item) => item.count), 0);
  $: ticks = getLinearTicks(maxCount);
  $: yMax = ticks.at(-1) ?? 1;
  $: barGap = data.length > 28 ? 2 : 4;
  $: slotWidth = data.length > 0 ? plotWidth / data.length : plotWidth;
  $: barWidth = Math.max(2, Math.min(26, slotWidth - barGap));

  function barX(index: number) {
    return margin.left + index * slotWidth + (slotWidth - barWidth) / 2;
  }

  function barY(count: number) {
    return margin.top + plotHeight - (yMax > 0 ? (count / yMax) * plotHeight : 0);
  }

  function selectMode(nextMode: "monthly" | "yearly") {
    mode = nextMode;
    pinned = null;
    hoverTooltip = null;
  }

  function activateTooltip(item: MovieCountDatum, event: PointerEvent) {
    const rect = container.getBoundingClientRect();

    hoverTooltip = {
      ...item,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function pinOnKeydown(event: KeyboardEvent, item: MovieCountDatum) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pinned = item;
    }
  }
</script>

<section class="flex flex-col border border-[var(--border)] bg-[var(--card)] p-4">
  <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-baseline gap-3">
      <h2 class="text-sm font-medium">Watched Over Time</h2>
      <p class="text-xs tabular-nums text-[var(--muted-foreground)]">All time</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="text-xs">
        <span class="text-[var(--muted-foreground)]">Watched </span>
        <span class="font-mono tabular-nums text-[var(--foreground)]">{watchedCount.toLocaleString()}</span>
      </div>
      <div class="flex">
        <button type="button" class={`h-7 border px-2 text-xs ${mode === "monthly" ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--background)]"}`} on:click={() => selectMode("monthly")}>Monthly</button>
        <button type="button" class={`h-7 border border-l-0 px-2 text-xs ${mode === "yearly" ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--background)]"}`} on:click={() => selectMode("yearly")}>Yearly</button>
      </div>
    </div>
  </div>

  <div class="grid gap-2">

  {#if mode === "monthly" && monthlyOmittedCount > 0}
    <div class="text-xs text-[var(--muted-foreground)]">
      {monthlyOmittedCount} approximate {monthlyOmittedCount === 1 ? "entry" : "entries"} omitted
    </div>
  {/if}

  {#if hasData}
    <div class="relative" role="presentation" bind:this={container} on:pointerleave={() => (hoverTooltip = null)}>
      <svg class="h-[260px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Watched over time chart" preserveAspectRatio="none">
        {#each ticks as tick}
          {@const y = margin.top + plotHeight - (yMax > 0 ? (tick / yMax) * plotHeight : 0)}
          <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="var(--border)" stroke-dasharray="2 4" />
          <text x={margin.left - 8} y={y + 4} text-anchor="end" class="fill-[var(--muted-foreground)] text-[10px] tabular-nums">{tick}</text>
        {/each}
        {#each data as item, index}
          {@const x = barX(index)}
          {@const y = barY(item.count)}
          {@const h = margin.top + plotHeight - y}
          <g>
            <title>{`${item.label}: ${item.count.toLocaleString()} ${item.count === 1 ? "movie watched" : "movies watched"}`}</title>
            <path
              d={getRoundedBarPath(x, y, barWidth, h)}
              fill="var(--chart-4)"
              class="cursor-pointer opacity-90 hover:opacity-100"
              role="button"
              tabindex="0"
              aria-label={`${item.label}: ${item.count.toLocaleString()} ${item.count === 1 ? "movie watched" : "movies watched"}`}
              on:pointerenter={(event) => activateTooltip(item, event)}
              on:pointermove={(event) => activateTooltip(item, event)}
              on:click={() => (pinned = item)}
              on:keydown={(event) => pinOnKeydown(event, item)}
            />
          </g>
          {#if shouldShowXAxisLabel(index, data.length)}
            <text x={x + barWidth / 2} y={height - 8} text-anchor="middle" class="fill-[var(--muted-foreground)] text-[10px] tabular-nums">{item.label}</text>
          {/if}
        {/each}
      </svg>

      {#if hoverTooltip && !pinned}
        <div
          class="pointer-events-none absolute z-10 max-w-[min(20rem,calc(100%-1rem))] -translate-y-[calc(100%+0.5rem)]"
          style={`left: clamp(0.5rem, ${hoverTooltip.x}px, calc(100% - 20rem)); top: ${hoverTooltip.y}px;`}
        >
          <MovieTooltipPanel
            title={hoverTooltip.label}
            count={hoverTooltip.count}
            movies={hoverTooltip.movies ?? []}
            singularLabel="movie watched"
            pluralLabel="movies watched"
          />
        </div>
      {/if}

      {#if pinned}
        <div class="absolute right-2 top-2 z-10 max-w-[calc(100%-1rem)]">
          <MovieTooltipPanel
            title={pinned.label}
            count={pinned.count}
            movies={pinned.movies ?? []}
            singularLabel="movie watched"
            pluralLabel="movies watched"
            pinned
            onClose={() => (pinned = null)}
          />
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
      No watched entries yet.
    </div>
  {/if}
  </div>
</section>
