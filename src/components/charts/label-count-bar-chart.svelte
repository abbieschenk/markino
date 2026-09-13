<script lang="ts">
  import type { LabelCount } from "@/lib/movie-chart-stats";
  import MovieTooltipPanel from "./movie-tooltip-panel.svelte";
  import { getRoundedRectPath } from "./static-chart-utils";

  export let data: LabelCount[] = [];
  export let emptyLabel = "No chart data yet.";
  export let scrollable = false;

  type TooltipData = LabelCount & {
    x: number;
    y: number;
  };

  let hoverTooltip: TooltipData | null = null;
  let pinnedTooltip: LabelCount | null = null;
  let container: HTMLDivElement;

  const width = 640;
  const rowHeight = 28;
  const labelWidth = 132;
  const rightPadding = 34;
  const labelTextStyle = "font-family: Arial, Helvetica, sans-serif; font-size: 12px; fill: var(--foreground);";
  const valueTextStyle = "font-family: Arial, Helvetica, sans-serif; font-size: 12px; fill: var(--foreground);";

  $: chartHeight = scrollable ? Math.max(300, data.length * rowHeight) : 300;
  $: maxCount = Math.max(...data.map((item) => item.count), 0);

  function truncateLabel(label: string) {
    return label.length > 18 ? `${label.slice(0, 17)}...` : label;
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

{#if data.length === 0}
  <div class="flex h-[300px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
    {emptyLabel}
  </div>
{:else}
  <div class="relative" bind:this={container} on:pointerleave={() => (hoverTooltip = null)}>
    <div class={scrollable ? "h-[300px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : undefined}>
      <svg class="w-full overflow-visible" style={`height: ${chartHeight}px`} viewBox={`0 0 ${width} ${chartHeight}`} role="img" aria-label="Label count chart" preserveAspectRatio="none">
        {#each data as item, index}
          {@const y = index * rowHeight + 4}
          {@const barWidth = maxCount > 0 ? (item.count / maxCount) * (width - labelWidth - rightPadding) : 0}
          <g>
            <title>{`${item.label}: ${item.count.toLocaleString()} ${item.count === 1 ? "movie" : "movies"}`}</title>
            <text x="0" y={y + 17} style={labelTextStyle}>{truncateLabel(item.label)}</text>
            <path
              d={getRoundedRectPath(labelWidth, y + 3, barWidth, 16, 2)}
              fill="var(--chart-5)"
              class="cursor-pointer opacity-90 hover:opacity-100"
              on:pointerenter={(event) => activateTooltip(item, event)}
              on:pointermove={(event) => activateTooltip(item, event)}
              on:click={() => (pinnedTooltip = item)}
            />
            <text x={labelWidth + barWidth + 8} y={y + 16} style={valueTextStyle}>{item.count}</text>
          </g>
        {/each}
      </svg>
    </div>

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
