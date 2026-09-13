<script lang="ts">
  import { actions } from "astro:actions";

  import { getActionData } from "@/lib/action-result";
  import type { TmdbMovieMatch } from "@/lib/tmdb";

  type Props = {
    ariaLabel: string;
    id: string;
    titleName: string;
    tmdbIdName: string;
    userId: string;
  };

  const SEARCH_DEBOUNCE_MS = 450;
  const MIN_SEARCH_LENGTH = 2;
  const PANEL_GAP = 4;
  const PANEL_MAX_HEIGHT = 288;
  const PANEL_MIN_HEIGHT = 56;

  let { ariaLabel, id, titleName, tmdbIdName, userId }: Props = $props();

  let requestId = 0;
  let title = $state("");
  let matches = $state<TmdbMovieMatch[]>([]);
  let selectedMatch = $state<TmdbMovieMatch | null>(null);
  let pending = $state(false);
  let focused = $state(false);
  let error = $state<string | null>(null);
  let fieldElement = $state<HTMLDivElement | null>(null);
  let panelStyle = $state<string | null>(null);

  $effect(() => {
    const query = title.trim();

    if (selectedMatch && query === selectedMatch.title) {
      return;
    }

    if (query.length < MIN_SEARCH_LENGTH) {
      matches = [];
      return;
    }

    const currentRequestId = requestId + 1;
    requestId = currentRequestId;
    const timeoutId = window.setTimeout(async () => {
      pending = true;

      try {
        const result = await getActionData(
          actions.searchTmdbMovieMatchesByTitle({ title: query, userId }),
        );

        if (requestId !== currentRequestId) {
          return;
        }

        if (result.status === "error") {
          matches = [];
          error = result.message;
          return;
        }

        matches = result.matches;
      } catch (searchError) {
        if (requestId !== currentRequestId) {
          return;
        }

        console.error("Failed to search TMDB", searchError);
        matches = [];
        error = "Unable to search TMDB.";
      } finally {
        if (requestId === currentRequestId) {
          pending = false;
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  });

  $effect(() => {
    if (!focused) {
      return;
    }

    updatePanelStyle();
    window.addEventListener("resize", updatePanelStyle);
    window.addEventListener("scroll", updatePanelStyle, true);

    return () => {
      window.removeEventListener("resize", updatePanelStyle);
      window.removeEventListener("scroll", updatePanelStyle, true);
    };
  });

  function handleTitleChange(nextTitle: string) {
    requestId += 1;
    title = nextTitle;
    matches = [];
    pending = false;
    error = null;

    if (selectedMatch && nextTitle !== selectedMatch.title) {
      selectedMatch = null;
    }
  }

  function selectMatch(match: TmdbMovieMatch) {
    requestId += 1;
    title = match.title;
    selectedMatch = match;
    matches = [];
    pending = false;
    error = null;
  }

  function updatePanelStyle() {
    if (!fieldElement) {
      return;
    }

    const rect = fieldElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - PANEL_GAP;
    const spaceAbove = rect.top - PANEL_GAP;
    const shouldOpenAbove =
      spaceBelow < PANEL_MIN_HEIGHT && spaceAbove > spaceBelow;
    const availableSpace = shouldOpenAbove ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(
      PANEL_MAX_HEIGHT,
      Math.max(PANEL_MIN_HEIGHT, Math.floor(availableSpace)),
    );
    const top = shouldOpenAbove ? null : rect.bottom + PANEL_GAP;
    const bottom = shouldOpenAbove
      ? window.innerHeight - rect.top + PANEL_GAP
      : null;

    panelStyle = [
      `left: ${rect.left}px`,
      `width: ${rect.width}px`,
      `max-height: ${maxHeight}px`,
      top == null ? null : `top: ${top}px`,
      bottom == null ? null : `bottom: ${bottom}px`,
    ]
      .filter(Boolean)
      .join("; ");
  }
</script>

<div class="relative min-w-0" bind:this={fieldElement}>
  <input type="hidden" name={tmdbIdName} value={selectedMatch?.tmdbId ?? ""} />
  <input
    {id}
    name={titleName}
    value={title}
    required
    aria-label={ariaLabel}
    autocomplete="off"
    class={[
      "border-input placeholder:text-muted-foreground h-9 w-full min-w-0 rounded-none border bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm",
      selectedMatch ? "pr-9" : "",
    ]}
    oninput={(event) => handleTitleChange(event.currentTarget.value)}
    onfocus={() => {
      focused = true;
      updatePanelStyle();
    }}
    onblur={() => window.setTimeout(() => (focused = false), 120)}
  />
  {#if selectedMatch}
    <button
      type="button"
      class="absolute right-1 top-1 h-7 w-7 rounded-none text-[var(--muted-foreground)] hover:bg-transparent hover:text-[var(--foreground)]"
      aria-label="Clear TMDB match"
      title="Clear TMDB match"
      onclick={() => {
        requestId += 1;
        selectedMatch = null;
        matches = [];
        pending = false;
      }}
    >
      {@render xIcon()}
    </button>
  {/if}
  {#if focused && (pending || error || matches.length > 0) && !selectedMatch}
    <div
      data-slot="movie-title-search-content"
      class="fixed z-[70] overflow-y-auto border border-[var(--border)] bg-[var(--background)] shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
      style={panelStyle ?? undefined}
    >
      {#if pending}
        <div class="px-3 py-2 text-xs text-[var(--muted-foreground)]">
          Searching TMDB
        </div>
      {/if}
      {#if error}
        <div class="px-3 py-2 text-xs text-[var(--destructive)]">{error}</div>
      {/if}
      {#if !pending && !error && matches.length > 0}
        {#each matches as match (match.tmdbId)}
          <button
            type="button"
            class="grid w-full gap-0.5 border-b border-[var(--border)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--muted)]"
            onmousedown={(event) => event.preventDefault()}
            onclick={() => selectMatch(match)}
          >
            <span class="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span class="truncate text-sm font-medium">{match.title}</span>
              <span class="text-[11px] text-[var(--muted-foreground)]">
                {match.releaseYear ?? "Unknown"} / {match.originalLanguage || "n/a"}
              </span>
            </span>
            {#if match.originalTitle !== match.title}
              <span class="truncate text-[11px] text-[var(--muted-foreground)]">
                {match.originalTitle}
              </span>
            {/if}
          </button>
        {/each}
      {/if}
    </div>
  {/if}
  {#if selectedMatch}
    <div
      class="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
    >
      TMDB {selectedMatch.tmdbId}{selectedMatch.releaseYear
        ? ` / ${selectedMatch.releaseYear}`
        : ""}
    </div>
  {/if}
</div>

{#snippet xIcon()}
  <svg
    aria-hidden="true"
    class="size-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
{/snippet}
