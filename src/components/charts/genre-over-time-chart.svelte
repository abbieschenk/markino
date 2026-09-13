<script lang="ts">
  import type { GenreOverTimeCount } from "@/lib/movie-chart-stats";
  import MovieTooltipPanel from "./movie-tooltip-panel.svelte";

  export let yearlyData: GenreOverTimeCount[] = [];

  type HeatmapCell = {
    key: string;
    genre: string;
    period: string;
    label: string;
    count: number;
    movies: string[];
  };

  type ActiveHeatmapCell = HeatmapCell & {
    x: number;
    y: number;
  };

  type PinnedMovieListTooltip = {
    key: string;
    title: string;
    count: number;
    movies: string[];
  };

  let activeCell: ActiveHeatmapCell | null = null;
  let pinnedTooltip: PinnedMovieListTooltip | null = null;
  let focusStartedByPointer = false;

  $: data = yearlyData;
  $: genreLabels = getGenreLabels(data);
  $: cells = genreLabels.flatMap((genre) =>
    data.map((period) => {
      const movies = period.moviesByGenre[genre] ?? [];

      return {
        key: `${genre}-${period.month}`,
        genre,
        period: period.month,
        label: period.label,
        count: movies.length,
        movies,
      };
    }),
  );
  $: hasData = cells.some((cell) => cell.count > 0);
  $: maxCount = Math.max(...cells.map((cell) => cell.count), 0);
  $: gridTemplateColumns = `minmax(7rem, 8.5rem) repeat(${data.length}, minmax(1.75rem, 1fr)) minmax(2.75rem, 3.5rem)`;
  $: hoverTooltip = activeCell
    ? {
        title: `${activeCell.genre} / ${activeCell.label}`,
        count: activeCell.count,
        movies: activeCell.movies,
        x: activeCell.x,
        y: activeCell.y,
      }
    : null;

  function getGenreLabels(data: GenreOverTimeCount[]) {
    const [firstItem] = data;

    if (!firstItem) {
      return [];
    }

    return Object.keys(firstItem.moviesByGenre);
  }

  function truncateGenreLabel(label: string) {
    return label.length > 18 ? `${label.slice(0, 17)}...` : label;
  }

  function shouldShowPeriodLabel(index: number, itemCount: number) {
    if (itemCount <= 12) {
      return true;
    }

    if (index === 0 || index === itemCount - 1) {
      return true;
    }

    return index % Math.ceil(itemCount / 8) === 0;
  }

  function getCellIntensity(count: number, maxCount: number) {
    if (count === 0 || maxCount === 0) {
      return 0;
    }

    return Math.round(18 + (count / maxCount) * 72);
  }

  function activateCellFromPointer(
    cell: HeatmapCell,
    event: PointerEvent & { currentTarget: HTMLButtonElement },
  ) {
    const container = event.currentTarget.closest("[data-genre-heatmap]");
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
    const container = element.closest("[data-genre-heatmap]");
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

  function pinTooltip(tooltip: PinnedMovieListTooltip) {
    activeCell = null;
    pinnedTooltip = tooltip;
  }

  function closePinnedTooltip() {
    activeCell = null;
    pinnedTooltip = null;
  }
</script>

<div class="relative grid gap-2">
  {#if hasData}
    <div class="relative" data-genre-heatmap>
      <div class="overflow-x-auto pb-1">
        <div class="grid min-w-max gap-px text-xs" style={`grid-template-columns: ${gridTemplateColumns};`}>
          <div aria-hidden="true"></div>
          {#each data as period, index}
            <div class="h-5 text-center font-mono text-[10px] leading-5 text-[var(--muted-foreground)] tabular-nums">
              {shouldShowPeriodLabel(index, data.length) ? period.label : ""}
            </div>
          {/each}
          <div class="h-5 border-l border-[var(--border)] pl-1 text-center font-mono text-[10px] leading-5 text-[var(--muted-foreground)] tabular-nums">
            Total
          </div>

          {#each genreLabels as genre}
            {@const totalMovies = data.flatMap(
              (period) => period.moviesByGenre[genre] ?? [],
            )}
            {@const totalCount = totalMovies.length}
            {@const totalCell = {
              key: `${genre}-total`,
              genre,
              period: "total",
              label: "Total",
              count: totalCount,
              movies: totalMovies,
            }}
            <div class="contents">
              <div
                class="h-7 truncate border-r border-[var(--border)] pr-2 text-xs leading-7"
                title={genre}
              >
                {truncateGenreLabel(genre)}
              </div>
              {#each data as period}
                {@const movies = period.moviesByGenre[genre] ?? []}
                {@const count = movies.length}
                {@const intensity = getCellIntensity(count, maxCount)}
                {@const cell = {
                  key: `${genre}-${period.month}`,
                  genre,
                  period: period.month,
                  label: period.label,
                  count,
                  movies,
                }}
                <button
                  type="button"
                  class="flex h-7 min-w-7 items-center justify-center border border-[var(--border)] font-mono text-[10px] tabular-nums outline-none hover:border-[var(--foreground)] focus-visible:border-[var(--foreground)] focus-visible:ring-1 focus-visible:ring-[var(--foreground)] disabled:cursor-default disabled:hover:border-[var(--border)]"
                  style={`${
                    intensity > 0
                      ? `background-color: color-mix(in oklch, var(--foreground) ${intensity}%, transparent);`
                      : ""
                  }${intensity > 58 ? "color: var(--background);" : ""}`}
                  aria-label={`${genre}, ${period.label}: ${count} ${
                    count === 1 ? "movie" : "movies"
                  }`}
                  disabled={count === 0}
                  on:pointerdown={() => (focusStartedByPointer = true)}
                  on:pointerenter={(event) => activateCellFromPointer(cell, event)}
                  on:pointermove={(event) => activateCellFromPointer(cell, event)}
                  on:pointerleave={() => (activeCell = null)}
                  on:focus={(event) => handleCellFocus(cell, event.currentTarget)}
                  on:blur={() => (activeCell = null)}
                  on:click={() => {
                    if (count === 0) {
                      return;
                    }

                    pinTooltip({
                      key: cell.key,
                      title: `${genre} / ${period.label}`,
                      count,
                      movies,
                    });
                  }}
                >
                  {count > 0 ? count : ""}
                </button>
              {/each}
              <button
                type="button"
                class="flex h-7 min-w-11 items-center justify-center border border-[var(--border)] border-l-[var(--foreground)] font-mono text-[10px] font-medium tabular-nums outline-none hover:border-[var(--foreground)] focus-visible:border-[var(--foreground)] focus-visible:ring-1 focus-visible:ring-[var(--foreground)]"
                aria-label={`${genre}, total: ${totalCount} ${
                  totalCount === 1 ? "movie" : "movies"
                }`}
                on:pointerdown={() => (focusStartedByPointer = true)}
                on:pointerenter={(event) => activateCellFromPointer(totalCell, event)}
                on:pointermove={(event) => activateCellFromPointer(totalCell, event)}
                on:pointerleave={() => (activeCell = null)}
                on:focus={(event) => handleCellFocus(totalCell, event.currentTarget)}
                on:blur={() => (activeCell = null)}
                on:click={() => {
                  pinTooltip({
                    key: totalCell.key,
                    title: `${genre} / Total`,
                    count: totalCount,
                    movies: totalMovies,
                  });
                }}
              >
                {totalCount}
              </button>
            </div>
          {/each}
        </div>
      </div>
      {#if hoverTooltip && !pinnedTooltip}
        <div
          class="pointer-events-none absolute z-10 max-w-[min(20rem,calc(100%-1rem))] -translate-y-[calc(100%+0.5rem)]"
          style={`left: clamp(0.5rem, ${hoverTooltip.x}px, calc(100% - 20rem)); top: ${hoverTooltip.y}px;`}
        >
          <MovieTooltipPanel
            title={hoverTooltip.title}
            count={hoverTooltip.count}
            movies={hoverTooltip.movies}
            singularLabel="movie"
            pluralLabel="movies"
          />
        </div>
      {/if}
      {#if pinnedTooltip}
        <div class="absolute right-2 top-2 z-10 max-w-[calc(100%-1rem)]">
          <MovieTooltipPanel
            title={pinnedTooltip.title}
            count={pinnedTooltip.count}
            movies={pinnedTooltip.movies}
            singularLabel="movie"
            pluralLabel="movies"
            pinned
            onClose={closePinnedTooltip}
          />
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex h-[260px] items-center justify-center border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)]">
      No genre metadata synced yet.
    </div>
  {/if}
</div>
