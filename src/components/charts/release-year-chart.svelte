<script lang="ts">
  import type { LabelCount } from "@/lib/movie-chart-stats";
  import MovieTooltipPanel from "./movie-tooltip-panel.svelte";
  import { getLinearTicks, getRoundedBarPath } from "./static-chart-utils";

  export let data: LabelCount[] = [];

  type TooltipData = LabelCount & {
    x: number;
    y: number;
  };

  let hoverTooltip: TooltipData | null = null;
  let pinnedTooltip: LabelCount | null = null;
  let container: HTMLDivElement;

  const width = 640;
  const height = 260;
  const margin = { top: 8, right: 8, bottom: 30, left: 34 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  $: chartData = data
    .map((item) => ({ key: item.label, label: item.label, count: item.count, movies: item.movies, year: Number(item.label) }))
    .filter((item) => Number.isFinite(item.year))
    .sort((left, right) => left.year - right.year);
  $: maxCount = Math.max(...chartData.map((item) => item.count), 0);
  $: ticks = getLinearTicks(maxCount);
  $: yMax = ticks.at(-1) ?? 1;
  $: minYear = chartData.length > 0 ? Math.min(...chartData.map((item) => item.year)) : 0;
  $: maxYear = chartData.length > 0 ? Math.max(...chartData.map((item) => item.year)) : 0;
  $: domainStart = minYear === maxYear ? minYear - 1 : minYear;
  $: domainEnd = minYear === maxYear ? maxYear + 1 : maxYear;

  function xForYear(year: number) {
    return margin.left + ((year - domainStart) / Math.max(1, domainEnd - domainStart)) * plotWidth;
  }

  function yForCount(count: number) {
    return margin.top + plotHeight - (yMax > 0 ? (count / yMax) * plotHeight : 0);
  }

  function activateTooltip(item: LabelCount, event: PointerEvent) {
    const rect = container.getBoundingClientRect();

    hoverTooltip = {
      ...item,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
</script>

{#if chartData.length === 0}
  <div class="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
    No release year metadata synced yet.
  </div>
{:else}
  <div class="relative" bind:this={container} on:pointerleave={() => (hoverTooltip = null)}>
    <svg class="h-[260px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Release years chart" preserveAspectRatio="none">
      {#each ticks as tick}
        {@const y = margin.top + plotHeight - (yMax > 0 ? (tick / yMax) * plotHeight : 0)}
        <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="var(--border)" stroke-dasharray="2 4" />
        <text x={margin.left - 8} y={y + 4} text-anchor="end" class="fill-[var(--muted-foreground)] text-[10px] tabular-nums">{tick}</text>
      {/each}
      {#each chartData as item}
        {@const x = xForYear(item.year)}
        {@const y = yForCount(item.count)}
        <g>
          <title>{item.label}: {item.count.toLocaleString()} {item.count === 1 ? "movie" : "movies"}</title>
          <path
            d={getRoundedBarPath(x - 4, y, 8, margin.top + plotHeight - y)}
            fill="var(--chart-4)"
            class="cursor-pointer opacity-90 hover:opacity-100"
            on:pointerenter={(event) => activateTooltip(item, event)}
            on:pointermove={(event) => activateTooltip(item, event)}
            on:click={() => (pinnedTooltip = item)}
          />
        </g>
      {/each}
      <text x={margin.left} y={height - 8} text-anchor="middle" class="fill-[var(--muted-foreground)] text-[10px] tabular-nums">{domainStart}</text>
      <text x={width - margin.right} y={height - 8} text-anchor="middle" class="fill-[var(--muted-foreground)] text-[10px] tabular-nums">{domainEnd}</text>
    </svg>

    {#if hoverTooltip && !pinnedTooltip}
      <div
        class="pointer-events-none absolute z-10 max-w-[min(20rem,calc(100%-1rem))] -translate-y-[calc(100%+0.5rem)]"
        style={`left: clamp(0.5rem, ${hoverTooltip.x}px, calc(100% - 20rem)); top: ${hoverTooltip.y}px;`}
      >
        <MovieTooltipPanel title={hoverTooltip.label} count={hoverTooltip.count} movies={hoverTooltip.movies} />
      </div>
    {/if}

    {#if pinnedTooltip}
      <div class="absolute right-2 top-2 z-10 max-w-[calc(100%-1rem)]">
        <MovieTooltipPanel
          title={pinnedTooltip.label}
          count={pinnedTooltip.count}
          movies={pinnedTooltip.movies}
          pinned
          onClose={() => (pinnedTooltip = null)}
        />
      </div>
    {/if}
  </div>
{/if}
