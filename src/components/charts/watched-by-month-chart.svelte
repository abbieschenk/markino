<script lang="ts">
  import type { WatchedByMonthCount } from "@/lib/movie-chart-stats";

  export let data: WatchedByMonthCount[] = [];

  type HeatmapCell = {
    key: string;
    year: string;
    month: string;
    label: string;
    count: number;
    total: number;
    percentage: number;
    movies: string[];
  };

  type ActiveHeatmapCell = HeatmapCell & {
    x: number;
    y: number;
  };

  let activeCell: ActiveHeatmapCell | null = null;
  let focusStartedByPointer = false;

  $: years = getWatchedYears(data);
  $: totalsByYear = new Map(
    years.map((year) => [
      year,
      data.reduce((sum, month) => sum + (Number(month[year]) || 0), 0),
    ]),
  );
  $: cells = years.flatMap((year) =>
    data.map((month) => {
      const count = Number(month[year]) || 0;
      const total = totalsByYear.get(year) ?? 0;
      const percentage = total > 0 ? (count / total) * 100 : 0;

      return {
        key: `${year}-${month.month}`,
        year,
        month: month.month,
        label: month.label,
        count,
        total,
        percentage,
        movies: month.moviesByYear[year] ?? [],
      };
    }),
  );
  $: hasData = cells.some((cell) => cell.count > 0);
  $: maxPercentage = Math.max(...cells.map((cell) => cell.percentage), 0);
  $: gridTemplateColumns = `max-content 0.375rem repeat(${data.length}, 1.75rem) minmax(3rem, 3.5rem)`;

  function getWatchedYears(data: WatchedByMonthCount[]) {
    const [firstItem] = data;

    if (!firstItem) {
      return [];
    }

    return Object.keys(firstItem.moviesByYear).sort((left, right) =>
      right.localeCompare(left),
    );
  }

  function formatPercentage(value: number) {
    return value > 0 && value < 1 ? "<1%" : `${Math.round(value)}%`;
  }

  function getCellIntensity(percentage: number, maxPercentage: number) {
    if (percentage === 0 || maxPercentage === 0) {
      return 0;
    }

    return Math.round(14 + (percentage / maxPercentage) * 74);
  }

  function isUpcomingMonth(year: string, month: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const yearNumber = Number(year);
    const monthNumber = Number(month);

    return (
      Number.isFinite(yearNumber) &&
      Number.isFinite(monthNumber) &&
      (yearNumber > currentYear ||
        (yearNumber === currentYear && monthNumber > currentMonth))
    );
  }

  function activateCellFromPointer(
    cell: HeatmapCell,
    event: PointerEvent & { currentTarget: HTMLButtonElement },
  ) {
    const container = event.currentTarget.closest("[data-watched-month-heatmap]");
    const containerRect = container?.getBoundingClientRect();

    activeCell = {
      ...cell,
      x: containerRect ? event.clientX - containerRect.left : 0,
      y: containerRect ? event.clientY - containerRect.top : 0,
    };
  }

  function activateCellFromElement(
    cell: HeatmapCell,
    element: HTMLButtonElement,
  ) {
    const container = element.closest("[data-watched-month-heatmap]");
    const containerRect = container?.getBoundingClientRect();
    const cellRect = element.getBoundingClientRect();

    activeCell = {
      ...cell,
      x: containerRect
        ? cellRect.left - containerRect.left + cellRect.width / 2
        : 0,
      y: containerRect ? cellRect.top - containerRect.top : 0,
    };
  }

  function handleCellFocus(cell: HeatmapCell, element: HTMLButtonElement) {
    if (focusStartedByPointer) {
      focusStartedByPointer = false;
      return;
    }

    activateCellFromElement(cell, element);
  }
</script>

{#if !hasData}
  <div class="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
    No exact-date watched entries yet.
  </div>
{:else}
  <div class="relative" data-watched-month-heatmap>
    <div class="overflow-x-auto pb-1">
      <div class="grid min-w-max text-xs" style={`grid-template-columns: ${gridTemplateColumns};`}>
        <div aria-hidden="true"></div>
        <div aria-hidden="true"></div>
        {#each data as month}
          <div class="ml-px h-5 text-center font-mono text-[10px] leading-5 text-[var(--muted-foreground)] tabular-nums">
            {month.label}
          </div>
        {/each}
        <div class="ml-px h-5 border-l border-[var(--border)] pl-1 text-center font-mono text-[10px] leading-5 text-[var(--muted-foreground)] tabular-nums">
          Total
        </div>

        {#each years as year}
          <div class="contents">
            <div class="h-7 font-mono text-xs leading-7 tabular-nums">
              {year}
            </div>
            <div aria-hidden="true"></div>
            {#each data as month}
              {@const count = Number(month[year]) || 0}
              {@const total = totalsByYear.get(year) ?? 0}
              {@const percentage = total > 0 ? (count / total) * 100 : 0}
              {@const isUpcoming = isUpcomingMonth(year, month.month)}
              {@const intensity = getCellIntensity(percentage, maxPercentage)}
              {@const cell = {
                key: `${year}-${month.month}`,
                year,
                month: month.month,
                label: month.label,
                count,
                total,
                percentage,
                movies: month.moviesByYear[year] ?? [],
              }}
              <button
                type="button"
                class={`ml-px flex h-7 w-7 items-center justify-center border outline-none hover:border-[var(--foreground)] focus-visible:border-[var(--foreground)] focus-visible:ring-1 focus-visible:ring-[var(--foreground)] disabled:cursor-default ${
                  isUpcoming
                    ? "border-transparent disabled:hover:border-transparent"
                    : "border-[var(--border)] disabled:hover:border-[var(--border)]"
                }`}
                style={`${
                  intensity > 0 && !isUpcoming
                    ? `background-color: color-mix(in oklch, var(--foreground) ${intensity}%, transparent);`
                    : ""
                }${
                  intensity > 58 && !isUpcoming
                    ? "color: var(--background);"
                    : ""
                }`}
                aria-label={`${year}, ${month.label}: ${formatPercentage(
                  percentage,
                )} of yearly watches`}
                disabled={count === 0}
                on:pointerdown={() => (focusStartedByPointer = true)}
                on:pointerenter={(event) => activateCellFromPointer(cell, event)}
                on:pointermove={(event) => activateCellFromPointer(cell, event)}
                on:pointerleave={() => (activeCell = null)}
                on:focus={(event) => handleCellFocus(cell, event.currentTarget)}
                on:blur={() => (activeCell = null)}
              >
                <span class="sr-only">
                  {count > 0 ? formatPercentage(percentage) : "0%"}
                </span>
              </button>
            {/each}
            <div class="ml-px flex h-7 min-w-12 items-center justify-center border border-[var(--border)] border-l-[var(--foreground)] font-mono text-[10px] font-medium tabular-nums">
              {totalsByYear.get(year) ?? 0}
            </div>
          </div>
        {/each}
      </div>
    </div>
    {#if activeCell}
      <div
        class="pointer-events-none absolute z-10 max-w-[min(20rem,calc(100%-1rem))] -translate-y-[calc(100%+0.5rem)]"
        style={`left: clamp(0.5rem, ${activeCell.x}px, calc(100% - 20rem)); top: ${activeCell.y}px;`}
      >
        <div class="min-w-48 border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs shadow-lg">
          <div class="font-medium">
            {activeCell.year} / {activeCell.label}
          </div>
          <div class="mt-1 font-mono text-[var(--muted-foreground)] tabular-nums">
            {formatPercentage(activeCell.percentage)} of {activeCell.total.toLocaleString()} yearly watches
          </div>
          <div class="mt-2 border-t border-[var(--border)] pt-2 font-mono tabular-nums">
            {activeCell.count.toLocaleString()} {activeCell.count === 1 ? "movie" : "movies"}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
