<script lang="ts">
  type Props = {
    id: string;
    name: string;
    onChange: (value: string[]) => void;
    options: string[];
    value: string[];
  };

  let { id, name, onChange, options, value }: Props = $props();
  let open = $state(false);

  const availableOptions = $derived(
    options.filter((option) => !value.includes(option)),
  );

  function addPerson(person: string) {
    onChange([...value, person]);
    open = false;
  }
</script>

<div class="relative min-w-0">
  {#each value as selected (selected)}
    <input type="hidden" {name} value={selected} />
  {/each}
  <div
    {id}
    class="flex min-h-9 flex-wrap items-center gap-1 rounded-none border border-[var(--border)] bg-[var(--background)] py-1 pl-2 pr-1 text-base shadow-none md:text-sm"
  >
    {#each value as selected (selected)}
      <button
        type="button"
        class="inline-flex items-center gap-1 border border-[var(--border)] px-1.5 py-0.5 text-base md:text-sm"
        onclick={() => onChange(value.filter((item) => item !== selected))}
        title={`Remove ${selected}`}
      >
        {selected}
        <svg
          aria-hidden="true"
          class="size-3"
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
      </button>
    {/each}
    <span class="min-w-3 flex-1" aria-hidden="true"></span>
    <button
      type="button"
      class="inline-flex size-7 shrink-0 items-center justify-center rounded-none text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-label="Add watched with"
      title="Add person"
      onclick={() => (open = !open)}
    >
      {@render plusIcon()}
    </button>
  </div>
  {#if open}
    <div
      class="absolute right-0 top-full z-[80] mt-1 max-h-56 min-w-40 overflow-y-auto border border-[var(--border)] bg-[var(--background)] shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
      role="listbox"
      tabindex="-1"
      onblur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          open = false;
        }
      }}
    >
      {#if availableOptions.length > 0}
        {#each availableOptions as option}
          <button
            type="button"
            class="block w-full border-b border-[var(--border)] px-3 py-2 text-left text-base last:border-b-0 hover:bg-[var(--muted)] md:text-sm"
            role="option"
            onclick={() => addPerson(option)}
          >
            {option}
          </button>
        {/each}
      {:else}
        <div class="px-3 py-2 text-base text-[var(--muted-foreground)] md:text-sm">
          No handles found.
        </div>
      {/if}
    </div>
  {/if}
</div>

{#snippet plusIcon()}
  <svg
    aria-hidden="true"
    class="size-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
{/snippet}
