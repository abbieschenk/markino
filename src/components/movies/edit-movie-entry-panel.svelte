<script lang="ts">
  import { actions } from "astro:actions";

  import { getActionData } from "@/lib/action-result";
  import type {
    MovieLedgerEntry,
    MovieWatchEntry,
    WatchDatePrecision,
  } from "@/lib/movies";
  import WatchedWithSelect from "@/components/movies/watched-with-select.svelte";

  export type EditableMovieEntryField =
    | "watchedOn"
    | "language"
    | "watchedWith";
  export type EditableMovieEntry = Pick<
    MovieLedgerEntry | MovieWatchEntry,
    | "watchEntryId"
    | "canEdit"
    | "title"
    | "watchedOn"
    | "watchedYear"
    | "watchedDatePrecision"
    | "watchedDateDisplay"
    | "language"
    | "watchedWith"
  >;
  export type MovieEntryEditTarget = {
    anchor: {
      left: number;
      top: number;
      width: number;
    };
    entry: EditableMovieEntry;
    field: EditableMovieEntryField;
  };

  type Props = {
    target: MovieEntryEditTarget;
    userId: string;
    watchedWithOptions: string[];
    onCancel: () => void;
  };

  let { target, userId, watchedWithOptions, onCancel }: Props = $props();

  let draftText = $state("");
  let draftWatchedOn = $state("");
  let draftWatchedYear = $state("");
  let draftDatePrecision = $state<WatchDatePrecision>("day");
  let draftWatchedWith = $state<string[]>([]);
  let pending = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    draftText = target.entry.language;
    draftWatchedOn =
      target.entry.watchedDatePrecision === "day" ? target.entry.watchedOn : "";
    draftWatchedYear =
      target.entry.watchedDatePrecision === "year"
        ? target.entry.watchedOn
        : String(target.entry.watchedYear).padStart(4, "0");
    draftDatePrecision = target.entry.watchedDatePrecision;
    draftWatchedWith = [...target.entry.watchedWith];
    pending = false;
    error = null;
  });

  function formatYearDigits(value: string) {
    return value.replace(/\D/g, "").slice(0, 4);
  }

  function preventNonYearDigit(event: InputEvent) {
    if (
      event.data &&
      /\D/.test(event.data) &&
      event.inputType !== "deleteContentBackward" &&
      event.inputType !== "deleteContentForward"
    ) {
      event.preventDefault();
    }
  }

  function pasteYearDigits(event: ClipboardEvent) {
    const pastedText = event.clipboardData?.getData("text") ?? "";
    const pastedDigits = formatYearDigits(pastedText);

    if (pastedText !== pastedDigits) {
      event.preventDefault();
      draftWatchedYear = pastedDigits;
    }
  }

  function getFieldLabel(field: EditableMovieEntryField) {
    if (field === "watchedOn") {
      return "Watched";
    }

    if (field === "watchedWith") {
      return "With";
    }

    return "Language";
  }

  function buildUpdateInput(
    updates: Partial<
      Pick<
        MovieLedgerEntry,
        "watchedOn" | "watchedDatePrecision" | "language" | "watchedWith"
      >
    >,
  ) {
    return {
      userId,
      watchEntryId: target.entry.watchEntryId,
      watchedOn: updates.watchedOn ?? target.entry.watchedOn,
      watchedDatePrecision:
        updates.watchedDatePrecision ?? target.entry.watchedDatePrecision,
      languageWatched: updates.language ?? target.entry.language,
      watchedWithHandles: updates.watchedWith ?? target.entry.watchedWith,
    };
  }

  async function saveEdit() {
    const nextTextValue = draftText.trim();
    const currentWatchedWith = [...target.entry.watchedWith].sort().join("\n");
    const nextWatchedWith = [...draftWatchedWith].sort().join("\n");
    const nextWatchedValue =
      draftDatePrecision === "day"
        ? draftWatchedOn.trim()
        : draftWatchedYear.trim();
    const hasChanged =
      target.field === "watchedWith"
        ? nextWatchedWith !== currentWatchedWith
        : target.field === "language"
          ? nextTextValue !== target.entry.language
          : nextWatchedValue !== target.entry.watchedOn ||
            draftDatePrecision !== target.entry.watchedDatePrecision;

    if (!hasChanged) {
      onCancel();
      return;
    }

    pending = true;
    error = null;

    try {
      const result = await getActionData(
        actions.updateMovieEntry(
          buildUpdateInput({
            language: target.field === "language" ? nextTextValue : undefined,
            watchedOn:
              target.field === "watchedOn" ? nextWatchedValue : undefined,
            watchedDatePrecision:
              target.field === "watchedOn" ? draftDatePrecision : undefined,
            watchedWith:
              target.field === "watchedWith" ? draftWatchedWith : undefined,
          }),
        ),
      );

      if (result.status === "error") {
        error = result.message ?? "Unable to update the movie entry.";
        return;
      }

      onCancel();
      window.location.reload();
    } catch (updateError) {
      console.error("Failed to update movie entry", updateError);
      error = "Unable to update the movie entry.";
    } finally {
      pending = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveEdit();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }
</script>

<div
  class="fixed z-50 grid gap-2 border border-[var(--border)] bg-[var(--background)] px-3 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.18)] md:grid-cols-[minmax(8rem,0.9fr)_minmax(12rem,1.6fr)_auto] md:items-center"
  style={`left: ${target.anchor.left}px; top: ${target.anchor.top}px; width: ${target.anchor.width}px;`}
>
  <div class="min-w-0">
    <div class="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      Edit {getFieldLabel(target.field)}
    </div>
    <div class="truncate text-sm font-medium">{target.entry.title}</div>
    {#if error}
      <div class="mt-1 text-xs text-[var(--destructive)]">{error}</div>
    {/if}
  </div>
  {#if target.field === "watchedOn"}
    <div class="grid grid-cols-[5.25rem_1fr]">
      <select
        class="h-8 w-full rounded-none border border-r-0 border-[var(--border)] bg-[var(--background)] px-2 text-sm shadow-none"
        aria-label="Date precision"
        disabled={pending}
        value={draftDatePrecision}
        onchange={(event) =>
          (draftDatePrecision = event.currentTarget.value as WatchDatePrecision)}
      >
        <option value="day">Date</option>
        <option value="year">Year</option>
      </select>
      {#if draftDatePrecision === "day"}
        <input
          type="date"
          disabled={pending}
          value={draftWatchedOn}
          class="h-8 rounded-none border border-r-0 border-[var(--border)] bg-transparent px-2 font-mono text-sm tabular-nums shadow-none"
          oninput={(event) => (draftWatchedOn = event.currentTarget.value)}
          onkeydown={handleKeyDown}
        />
      {:else}
        <input
          disabled={pending}
          value={draftWatchedYear}
          inputmode="numeric"
          pattern="[0-9]{4}"
          maxlength="4"
          class="h-8 rounded-none border border-[var(--border)] bg-transparent px-2 font-mono text-sm tabular-nums shadow-none"
          onbeforeinput={preventNonYearDigit}
          onpaste={pasteYearDigits}
          oninput={(event) =>
            (draftWatchedYear = formatYearDigits(event.currentTarget.value))}
          onkeydown={handleKeyDown}
        />
      {/if}
    </div>
  {:else if target.field === "language"}
    <input
      disabled={pending}
      value={draftText}
      class="h-8 rounded-none border border-[var(--border)] bg-transparent px-2 text-sm shadow-none"
      oninput={(event) => (draftText = event.currentTarget.value)}
      onkeydown={handleKeyDown}
    />
  {:else}
    <div class={pending ? "pointer-events-none opacity-60" : ""}>
      <WatchedWithSelect
        id="edit-watched-with"
        name="edit-watched-with"
        options={watchedWithOptions}
        value={draftWatchedWith}
        onChange={(value) => (draftWatchedWith = value)}
      />
    </div>
  {/if}
  <div class="flex items-center justify-end gap-1">
    <button
      type="button"
      class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      disabled={pending}
      onclick={() => void saveEdit()}
      aria-label="Save edit"
      title="Save"
    >
      ok
    </button>
    <button
      type="button"
      class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      disabled={pending}
      onclick={onCancel}
      aria-label="Cancel edit"
      title="Cancel"
    >
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
    </button>
  </div>
</div>
