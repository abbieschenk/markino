<script lang="ts">
  import type { LabelCount } from "@/lib/movie-chart-stats";
  import MovieTooltipPanel from "./movie-tooltip-panel.svelte";

  export let data: LabelCount[] = [];

  type PieSlice = LabelCount & {
    path: string;
    percentage: number;
    color: string;
  };

  type HoverTooltip = PieSlice & { x: number; y: number };

  let container: HTMLDivElement;
  let hoverTooltip: HoverTooltip | null = null;
  let pinnedTooltip: PieSlice | null = null;

  const size = 260;
  const center = size / 2;
  const radius = 112;
  const colors = [
    "var(--chart-5)",
    "var(--chart-3)",
    "var(--chart-1)",
    "var(--chart-4)",
    "var(--chart-2)",
  ];

  $: total = data.reduce((sum, item) => sum + item.count, 0);
  $: slices = buildSlices(data, total);

  function pointAt(angle: number) {
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  }

  function slicePath(startAngle: number, endAngle: number) {
    if (endAngle - startAngle >= Math.PI * 2 - Number.EPSILON) {
      return `M ${center - radius} ${center} A ${radius} ${radius} 0 1 0 ${center + radius} ${center} A ${radius} ${radius} 0 1 0 ${center - radius} ${center} Z`;
    }

    const start = pointAt(startAngle);
    const end = pointAt(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  }

  function buildSlices(items: LabelCount[], count: number): PieSlice[] {
    let angle = -Math.PI / 2;

    return items.map((item, index) => {
      const startAngle = angle;
      const share = count > 0 ? item.count / count : 0;
      angle += share * Math.PI * 2;

      return {
        ...item,
        path: slicePath(startAngle, angle),
        percentage: share * 100,
        color: colors[index % colors.length],
      };
    });
  }

  function showTooltip(item: PieSlice, event: PointerEvent) {
    const rect = container.getBoundingClientRect();
    hoverTooltip = {
      ...item,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function showTooltipAtElement(item: PieSlice, element: HTMLElement) {
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    hoverTooltip = {
      ...item,
      x: elementRect.left - containerRect.left + elementRect.width / 2,
      y: elementRect.top - containerRect.top,
    };
  }

  function pinOnKeydown(event: KeyboardEvent, item: PieSlice) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pinnedTooltip = item;
    }
  }

  function formatPercentage(value: number) {
    return value > 0 && value < 1 ? "<1%" : `${Math.round(value)}%`;
  }
</script>

{#if total === 0}
  <div class="flex h-[300px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
    No watched-language data yet.
  </div>
{:else}
  <div class="relative grid min-h-[300px] items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.75fr)]" role="presentation" bind:this={container} on:pointerleave={() => (hoverTooltip = null)}>
    <svg class="mx-auto aspect-square w-full max-w-[260px]" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Languages watched across ${total} ${total === 1 ? "movie" : "movies"}`}>
      {#each slices as item}
        <path
          d={item.path}
          fill={item.color}
          stroke="var(--card)"
          stroke-width="2"
          class="cursor-pointer opacity-90 outline-none hover:opacity-100 focus-visible:opacity-100"
          role="button"
          tabindex="0"
          aria-label={`${item.label}: ${item.count} ${item.count === 1 ? "movie" : "movies"}, ${formatPercentage(item.percentage)}`}
          on:pointerenter={(event) => showTooltip(item, event)}
          on:pointermove={(event) => showTooltip(item, event)}
          on:click={() => (pinnedTooltip = item)}
          on:keydown={(event) => pinOnKeydown(event, item)}
        >
          <title>{`${item.label}: ${item.count} (${formatPercentage(item.percentage)})`}</title>
        </path>
      {/each}
    </svg>

    <ul class="grid max-h-[280px] gap-2 overflow-y-auto pr-1 text-xs">
      {#each slices as item}
        <li>
          <button
            type="button"
            class="grid w-full grid-cols-[0.625rem_minmax(0,1fr)_auto] items-center gap-2 text-left outline-none hover:bg-[var(--accent)] focus-visible:bg-[var(--accent)]"
            aria-label={`${item.label}: ${item.count} ${item.count === 1 ? "movie" : "movies"}, ${formatPercentage(item.percentage)}`}
            on:pointerenter={(event) => showTooltip(item, event)}
            on:pointermove={(event) => showTooltip(item, event)}
            on:focus={(event) => showTooltipAtElement(item, event.currentTarget)}
            on:blur={() => (hoverTooltip = null)}
            on:click={() => (pinnedTooltip = item)}
          >
            <span class="h-2.5 w-2.5" style={`background: ${item.color};`} aria-hidden="true"></span>
            <span class="truncate" title={item.label}>{item.label}</span>
            <span class="font-mono text-[var(--muted-foreground)] tabular-nums">
              {item.count} · {formatPercentage(item.percentage)}
            </span>
          </button>
        </li>
      {/each}
    </ul>

    {#if hoverTooltip && !pinnedTooltip}
      <div class="pointer-events-none absolute z-10 max-w-[min(20rem,calc(100%-1rem))] -translate-y-[calc(100%+0.5rem)]" style={`left: clamp(0.5rem, ${hoverTooltip.x}px, calc(100% - 20rem)); top: ${hoverTooltip.y}px;`}>
        <MovieTooltipPanel title={hoverTooltip.label} count={hoverTooltip.count} movies={hoverTooltip.movies} />
      </div>
    {/if}

    {#if pinnedTooltip}
      <div class="absolute right-2 top-2 z-10 max-w-[calc(100%-1rem)]">
        <MovieTooltipPanel title={pinnedTooltip.label} count={pinnedTooltip.count} movies={pinnedTooltip.movies} pinned onClose={() => (pinnedTooltip = null)} />
      </div>
    {/if}
  </div>
{/if}
