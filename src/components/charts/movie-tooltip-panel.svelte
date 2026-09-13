<script lang="ts">
  export let title = "";
  export let count = 0;
  export let movies: string[] = [];
  export let singularLabel = "movie";
  export let pluralLabel = "movies";
  export let pinned = false;
  export let onClose: (() => void) | undefined = undefined;

  function closePinnedTooltip(event: MouseEvent) {
    event.stopPropagation();
    onClose?.();
  }
</script>

<div class="min-w-60 max-w-80 border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs shadow-lg">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      {#if title}
        <div class="font-medium">{title}</div>
      {/if}
      <div class="mt-1 font-mono text-[var(--muted-foreground)] tabular-nums">
        {count.toLocaleString()} {count === 1 ? singularLabel : pluralLabel}
      </div>
    </div>
    {#if pinned && onClose}
      <button
        type="button"
        class="-mr-1 -mt-1 h-7 w-7 border border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
        aria-label="Close pinned tooltip"
        on:click={closePinnedTooltip}
      >
        x
      </button>
    {/if}
  </div>
  {#if movies.length > 0}
    <ul class="mt-2 grid max-h-80 gap-1 overflow-y-auto border-t border-[var(--border)] pt-2 pr-1 text-[var(--foreground)]">
      {#each movies as movie, index}
        <li class="leading-snug">{movie}</li>
      {/each}
    </ul>
  {/if}
</div>
