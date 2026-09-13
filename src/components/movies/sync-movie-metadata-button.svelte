<script lang="ts">
  import { actions } from "astro:actions";

  import { getActionData } from "@/lib/action-result";
  import type { TmdbMovieMatch } from "@/lib/tmdb";

  type Props = {
    display?: "label" | "icon";
    movieId: string;
    title: string;
    userId: string;
  };

  let { display = "label", movieId, title, userId }: Props = $props();

  let open = $state(false);
  let matches = $state<TmdbMovieMatch[]>([]);
  let selectedTmdbId = $state<number | null>(null);
  let searchPending = $state(false);
  let syncPending = $state(false);
  let error = $state<string | null>(null);

  async function searchMatches() {
    searchPending = true;
    error = null;
    matches = [];
    selectedTmdbId = null;

    try {
      const result = await getActionData(
        actions.searchTmdbMovieMatches({ movieId, userId }),
      );

      if (result.status === "error") {
        error = result.message;
        return;
      }

      matches = result.matches;
      selectedTmdbId = result.matches[0]?.tmdbId ?? null;
    } catch (searchError) {
      console.error("Failed to search TMDB", searchError);
      error = "Unable to search TMDB.";
    } finally {
      searchPending = false;
    }
  }

  function openDialog() {
    open = true;
    void searchMatches();
  }

  function closeDialog() {
    if (syncPending) {
      return;
    }

    open = false;
  }

  async function handleSync() {
    if (!selectedTmdbId) {
      error = "Select a TMDB match first.";
      return;
    }

    syncPending = true;
    error = null;

    try {
      const result = await getActionData(
        actions.syncMovieMetadata({ movieId, tmdbId: selectedTmdbId, userId }),
      );

      if (result.status === "error") {
        error = result.message ?? "Unable to sync movie metadata.";
        return;
      }

      open = false;
      window.location.reload();
    } catch (syncError) {
      console.error("Failed to sync movie metadata", syncError);
      error = "Unable to sync movie metadata.";
    } finally {
      syncPending = false;
    }
  }
</script>

<button
  type="button"
  class={[
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
    display === "icon"
      ? "size-8 text-[var(--muted-foreground)] hover:bg-transparent hover:text-[var(--foreground)]"
      : "h-8 rounded-none border border-[var(--border)] px-3 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
  ]}
  aria-label={`Sync TMDB metadata for ${title}`}
  title={`Sync TMDB metadata for ${title}`}
  onclick={openDialog}
>
  {@render syncIcon()}
  {#if display === "label"}
    Sync TMDB
  {/if}
</button>

{#if open}
  <button
    type="button"
    class="fixed inset-0 z-40 cursor-default bg-black/35"
    aria-label="Close sync dialog"
    onclick={closeDialog}
  ></button>
  <div class="fixed inset-0 z-50 grid place-items-center p-4">
    <div
      class="w-full max-w-2xl rounded-none border border-[var(--border)] bg-[var(--background)] p-0 text-[var(--foreground)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
      role="dialog"
      aria-modal="true"
      aria-label="Sync TMDB"
    >
      <div class="border-b border-[var(--border)] px-4 py-3">
        <h2
          class="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]"
        >
          Sync TMDB
        </h2>
      </div>
      <div class="grid gap-3 px-4 py-4 text-sm">
        <div class="font-medium">{title}</div>
        {#if searchPending}
          <div class="border border-[var(--border)] px-3 py-4 text-[var(--muted-foreground)]">
            Searching TMDB
          </div>
        {/if}
        {#if !searchPending && matches.length === 0 && !error}
          <div class="border border-[var(--border)] px-3 py-4 text-[var(--muted-foreground)]">
            No TMDB matches found.
          </div>
        {/if}
        {#if matches.length > 0}
          <div class="max-h-[22rem] overflow-y-auto border border-[var(--border)]">
            {#each matches as match (match.tmdbId)}
              <button
                type="button"
                class={[
                  "grid w-full gap-1 border-b border-[var(--border)] px-3 py-3 text-left last:border-b-0 hover:bg-[var(--muted)]",
                  selectedTmdbId === match.tmdbId ? "bg-[var(--muted)]" : "",
                ]}
                onclick={() => (selectedTmdbId = match.tmdbId)}
              >
                <span class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span class="font-medium">{match.title}</span>
                  <span class="text-xs text-[var(--muted-foreground)]">
                    {match.releaseYear ?? "Unknown year"} / {match.originalLanguage ||
                      "n/a"}
                  </span>
                </span>
                {#if match.originalTitle !== match.title}
                  <span class="text-xs text-[var(--muted-foreground)]">
                    {match.originalTitle}
                  </span>
                {/if}
                <span class="line-clamp-2 text-xs leading-5 text-[var(--muted-foreground)]">
                  {match.overview || "No overview available."}
                </span>
              </button>
            {/each}
          </div>
        {/if}
        {#if error}
          <p
            class="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]"
          >
            {error}
          </p>
        {/if}
      </div>
      <div
        class="flex justify-end gap-2 rounded-none border-t border-[var(--border)] bg-transparent px-4 py-3"
      >
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          disabled={syncPending}
          onclick={closeDialog}
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          disabled={searchPending || syncPending || !selectedTmdbId}
          onclick={handleSync}
        >
          {syncPending ? "Syncing..." : "Confirm Sync"}
        </button>
      </div>
    </div>
  </div>
{/if}

{#snippet syncIcon()}
  <svg
    aria-hidden="true"
    class="size-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="1.8"
    viewBox="0 0 24 24"
  >
    <path d="M21 12a9 9 0 0 1-15.54 6.2L3 16" />
    <path d="M3 21v-5h5" />
    <path d="M3 12a9 9 0 0 1 15.54-6.2L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
{/snippet}
