<script lang="ts">
  import {
    columnFilteringFeature,
    createFilteredRowModel,
    createSortedRowModel,
    createTable,
    createTableState,
    rowSortingFeature,
    sortFns,
    tableFeatures,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
  } from "@tanstack/svelte-table";
  import { actions } from "astro:actions";

  import EditMovieEntryPanel, {
    type EditableMovieEntry,
    type EditableMovieEntryField,
    type MovieEntryEditTarget,
  } from "@/components/movies/edit-movie-entry-panel.svelte";
  import MovieTitleSearchField from "@/components/movies/movie-title-search-field.svelte";
  import WatchedWithSelect from "@/components/movies/watched-with-select.svelte";
  import { getActionData } from "@/lib/action-result";
  import type {
    MovieLedgerEntry,
    WatchDatePrecision,
    WatchStatus,
  } from "@/lib/movies";
  type Props = {
    data: MovieLedgerEntry[];
    defaultWatchedWith: string[];
    userId: string;
    watchedWithOptions: string[];
  };

  type DropTarget = {
    movieId: string;
    position: "before" | "after";
  };

  type MovieFormRow = {
    id: string;
    status: WatchStatus;
    watchedDatePrecision: WatchDatePrecision;
    watchedOn: string;
    watchedYear: string;
    watchedWith: string[];
  };

  const STATUS_OPTIONS: Array<{ value: WatchStatus; label: string }> = [
    { value: "watched", label: "Watched" },
    { value: "dnf", label: "DNF" },
    { value: "dns", label: "DNS" },
  ];
  const FILTER_STATUS_OPTIONS: Array<WatchStatus | "all"> = [
    "all",
    "watched",
    "dnf",
    "dns",
  ];
  const TITLE_SEARCH_DEBOUNCE_MS = 300;
  const SPLICE_DURATION_MS = 650;

  let {
    data,
    defaultWatchedWith,
    userId,
    watchedWithOptions,
  }: Props = $props();

  let tableData = $state<MovieLedgerEntry[]>([]);
  let titleSearch = $state("");
  let debouncedTitleSearch = $state("");
  let draggedMovieId = $state<string | null>(null);
  let dropTarget = $state<DropTarget | null>(null);
  let splicedMovieId = $state<string | null>(null);
  let expandedMovieIds = $state<Set<string>>(new Set());
  let isSavingOrder = $state(false);
  let orderError = $state<string | null>(null);
  let editTarget = $state<MovieEntryEditTarget | null>(null);
  let addDialogOpen = $state(false);
  let addPending = $state(false);
  let addError = $state<string | null>(null);
  let addRows = $state<MovieFormRow[]>([createMovieFormRow(0)]);
  let nextAddRowId = $state(1);
  let deleteTarget = $state<{ title: string; watchEntryId: string } | null>(
    null,
  );
  let deletePending = $state(false);
  let deleteError = $state<string | null>(null);

  const [sorting, setSorting] = createTableState<SortingState>([
    { id: "rank", desc: false },
  ]);
  const [columnFilters, setColumnFilters] =
    createTableState<ColumnFiltersState>([]);
  const features = tableFeatures({
    columnFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns,
  });
  const columns: ColumnDef<MovieLedgerEntry>[] = [
    {
      accessorKey: "rank",
      header: "#",
      sortingFn: "basic",
      enableColumnFilter: false,
    },
    { accessorKey: "title", header: "Title" },
    {
      id: "watchedOn",
      accessorKey: "watchedDateDisplay",
      header: "Watched",
      sortingFn: (left, right) =>
        compareWatchedDates(left.original, right.original),
    },
    { accessorKey: "language", header: "Language" },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: (row, _columnId, filterValue) =>
        !filterValue ||
        filterValue === "all" ||
        row.original.watchEntries.some((entry) => entry.status === filterValue),
    },
    {
      accessorKey: "watchedWith",
      header: "With",
      filterFn: (row, _columnId, filterValue) =>
        !filterValue ||
        filterValue === "all" ||
        row.original.watchEntries.some((entry) =>
          entry.watchedWith.includes(String(filterValue)),
        ),
      sortingFn: (left, right, columnId) => {
        const leftValue = left.getValue<string[]>(columnId).join(", ");
        const rightValue = right.getValue<string[]>(columnId).join(", ");

        return leftValue.localeCompare(rightValue, "en");
      },
    },
  ];

  const table = createTable({
    columns,
    features,
    get data() {
      return tableData;
    },
    getRowId: (row) => row.movieId,
    state: {
      get columnFilters() {
        return columnFilters();
      },
      get sorting() {
        return sorting();
      },
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
  });

  const canReorder = $derived(
    sorting().length === 1 &&
      sorting()[0]?.id === "rank" &&
      sorting()[0]?.desc === false &&
      columnFilters().length === 0 &&
      titleSearch.trim() === "",
  );
  const canDragReorder = $derived(canReorder && !isSavingOrder);
  const visibleRows = $derived.by(() => {
    const query = debouncedTitleSearch.trim().toLowerCase();
    const rows = table.getRowModel().rows;

    if (!query) {
      return rows;
    }

    return rows.filter((row) => row.original.title.toLowerCase().includes(query));
  });
  const statusFilter = $derived(
    (table.getColumn("status")?.getFilterValue() as string | undefined) ??
      "all",
  );
  const watchedWithFilter = $derived(
    (table.getColumn("watchedWith")?.getFilterValue() as string | undefined) ??
      "all",
  );
  const tableWatchedWithOptions = $derived.by(() => {
    const people = new Set<string>();

    for (const movie of tableData) {
      for (const entry of movie.watchEntries) {
        for (const person of entry.watchedWith) {
          people.add(person);
        }
      }
    }

    return [
      "all",
      ...Array.from(people).sort((left, right) => left.localeCompare(right)),
    ];
  });

  $effect(() => {
    tableData = data;
  });

  $effect(() => {
    if (!splicedMovieId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      splicedMovieId = null;
    }, SPLICE_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  });

  $effect(() => {
    const query = titleSearch.trim();
    const timeoutId = window.setTimeout(() => {
      debouncedTitleSearch = query;
    }, TITLE_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  });

  function compareWatchedDates(
    left: MovieLedgerEntry,
    right: MovieLedgerEntry,
  ) {
    if (left.watchedYear !== right.watchedYear) {
      return left.watchedYear - right.watchedYear;
    }

    if (left.watchedOn && right.watchedOn && left.watchedOn !== right.watchedOn) {
      return left.watchedOn.localeCompare(right.watchedOn);
    }

    if (left.watchedDatePrecision !== right.watchedDatePrecision) {
      return left.watchedDatePrecision === "day" ? -1 : 1;
    }

    return left.title.localeCompare(right.title, "en");
  }

  function rankLedgerEntries(entries: MovieLedgerEntry[]) {
    return entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  function moveMovieInRankOrder(
    entries: MovieLedgerEntry[],
    movedMovieId: string,
    target: DropTarget,
  ) {
    if (movedMovieId === target.movieId) {
      return null;
    }

    const rankOrderedEntries = [...entries].sort((left, right) => {
      if (left.rank !== right.rank) {
        return left.rank - right.rank;
      }

      return left.title.localeCompare(right.title, "en");
    });
    const movedEntry = rankOrderedEntries.find(
      (entry) => entry.movieId === movedMovieId,
    );

    if (!movedEntry) {
      return null;
    }

    const entriesWithoutMoved = rankOrderedEntries.filter(
      (entry) => entry.movieId !== movedMovieId,
    );
    const targetIndex = entriesWithoutMoved.findIndex(
      (entry) => entry.movieId === target.movieId,
    );

    if (targetIndex === -1) {
      return null;
    }

    const insertIndex =
      target.position === "after" ? targetIndex + 1 : targetIndex;
    entriesWithoutMoved.splice(insertIndex, 0, movedEntry);

    return rankLedgerEntries(entriesWithoutMoved);
  }

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

  function pasteYearDigits(event: ClipboardEvent, rowId: string) {
    const pastedText = event.clipboardData?.getData("text") ?? "";
    const pastedDigits = formatYearDigits(pastedText);

    if (pastedText !== pastedDigits) {
      event.preventDefault();
      updateMovieRow(rowId, { watchedYear: pastedDigits });
    }
  }

  function createMovieFormRow(id: number): MovieFormRow {
    return {
      id: String(id),
      status: "watched",
      watchedDatePrecision: "day",
      watchedOn: "",
      watchedYear: "",
      watchedWith: [...defaultWatchedWith],
    };
  }

  function createMovieFormRowFromPrevious(
    id: number,
    previousRow: MovieFormRow | undefined,
  ): MovieFormRow {
    return {
      ...createMovieFormRow(id),
      watchedDatePrecision: previousRow?.watchedDatePrecision ?? "day",
      watchedOn: previousRow?.watchedOn ?? "",
      watchedYear: previousRow?.watchedYear ?? "",
    };
  }

  function toggleExpandedMovie(movieId: string) {
    const next = new Set(expandedMovieIds);

    if (next.has(movieId)) {
      next.delete(movieId);
    } else {
      next.add(movieId);
    }

    expandedMovieIds = next;
  }

  function toggleSort(columnId: string) {
    const column = table.getColumn(columnId);
    const current = column?.getIsSorted();

    column?.toggleSorting(current === "asc");
  }

  function isActiveEditTarget(
    entry: EditableMovieEntry,
    field: EditableMovieEntryField,
  ) {
    return (
      editTarget?.entry.watchEntryId === entry.watchEntryId &&
      editTarget.field === field
    );
  }

  function startEdit(
    event: MouseEvent,
    entry: EditableMovieEntry,
    field: EditableMovieEntryField,
  ) {
    if (!entry.canEdit) {
      return;
    }

    const element = event.currentTarget as HTMLButtonElement;
    const rect = element.getBoundingClientRect();
    const panelWidth = Math.min(
      field === "language" ? 420 : 520,
      window.innerWidth - 24,
    );

    editTarget = {
      anchor: {
        left: Math.max(
          12,
          Math.min(rect.left, window.innerWidth - panelWidth - 12),
        ),
        top: rect.bottom + 4,
        width: panelWidth,
      },
      entry,
      field,
    };
  }

  function handleDragStart(event: DragEvent, movieId: string) {
    if (!canDragReorder) {
      event.preventDefault();
      return;
    }

    draggedMovieId = movieId;
    event.dataTransfer?.setData("text/plain", movieId);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(event: DragEvent, movieId: string) {
    if (!canDragReorder || !draggedMovieId || draggedMovieId === movieId) {
      return;
    }

    event.preventDefault();

    const rowBounds = (event.currentTarget as HTMLTableRowElement)
      .getBoundingClientRect();
    const position =
      event.clientY - rowBounds.top > rowBounds.height / 2 ? "after" : "before";

    dropTarget = { movieId, position };
  }

  function handleDrop(event: DragEvent, movieId: string) {
    event.preventDefault();

    if (!canDragReorder || !draggedMovieId) {
      return;
    }

    const movedMovieId = draggedMovieId;
    const target = dropTarget ?? { movieId, position: "before" };
    const previousData = tableData;
    const nextData = moveMovieInRankOrder(tableData, movedMovieId, target);

    draggedMovieId = null;
    dropTarget = null;

    if (!nextData) {
      return;
    }

    tableData = nextData;
    splicedMovieId = movedMovieId;
    void persistMovieOrder(nextData, previousData);
  }

  function handleDragEnd() {
    draggedMovieId = null;
    dropTarget = null;
  }

  async function persistMovieOrder(
    nextData: MovieLedgerEntry[],
    previousData: MovieLedgerEntry[],
  ) {
    isSavingOrder = true;
    orderError = null;

    try {
      const result = await getActionData(
        actions.reorderMovieRankings({
          movieIds: [...nextData]
            .sort((left, right) => left.rank - right.rank)
            .map((entry) => entry.movieId),
          userId,
        }),
      );

      if (result.status === "error") {
        tableData = previousData;
        splicedMovieId = null;
        orderError = result.message ?? "Unable to save the movie order.";
      }
    } catch (error) {
      console.error("Failed to persist movie order", error);
      tableData = previousData;
      splicedMovieId = null;
      orderError = "Unable to save the movie order.";
    } finally {
      isSavingOrder = false;
    }
  }

  function openAddDialog() {
    addDialogOpen = true;
    addPending = false;
    addError = null;
    nextAddRowId = 1;
    addRows = [createMovieFormRow(0)];
  }

  function addMovieRow() {
    const previousRow = addRows.at(-1);
    addRows = [
      ...addRows,
      createMovieFormRowFromPrevious(nextAddRowId, previousRow),
    ];
    nextAddRowId += 1;
  }

  function removeMovieRow(rowId: string) {
    if (addRows.length === 1) {
      return;
    }

    addRows = addRows.filter((row) => row.id !== rowId);
  }

  function updateMovieRow(rowId: string, nextRow: Partial<MovieFormRow>) {
    addRows = addRows.map((row) =>
      row.id === rowId ? { ...row, ...nextRow } : row,
    );
  }

  async function handleAddSubmit(event: SubmitEvent) {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("userId", userId);
    addPending = true;
    addError = null;

    try {
      const result = await getActionData(actions.addMovieEntry(formData));

      if (result.status === "error") {
        addError = result.message ?? "Unable to add movie.";
        return;
      }

      addDialogOpen = false;
      window.location.reload();
    } catch (error) {
      console.error("Failed to add movie", error);
      addError = "Unable to add movie.";
    } finally {
      addPending = false;
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    deletePending = true;
    deleteError = null;

    try {
      const result = await getActionData(
        actions.deleteMovieEntry({
          userId,
          watchEntryId: deleteTarget.watchEntryId,
        }),
      );

      if (result.status === "error") {
        deleteError = result.message ?? "Unable to delete the movie entry.";
        return;
      }

      deleteTarget = null;
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete movie entry", error);
      deleteError = "Unable to delete the movie entry.";
    } finally {
      deletePending = false;
    }
  }

</script>

<section
  class="flex h-full min-h-0 flex-col overflow-hidden border border-[var(--border)] bg-white/40"
>
  <div
    class="flex flex-col gap-3 border-b border-[var(--border)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="flex flex-wrap gap-2">
      <select
        class="h-8 min-w-32 rounded-none border border-[var(--border)] bg-[var(--background)] px-2 text-sm shadow-none"
        aria-label="Status filter"
        value={statusFilter}
        onchange={(event) => {
          const value = event.currentTarget.value;
          table
            .getColumn("status")
            ?.setFilterValue(value === "all" ? undefined : value);
        }}
      >
        {#each FILTER_STATUS_OPTIONS as status}
          <option value={status}>Status: {status}</option>
        {/each}
      </select>
      <select
        class="h-8 min-w-36 rounded-none border border-[var(--border)] bg-[var(--background)] px-2 text-sm shadow-none"
        aria-label="Watched with filter"
        value={watchedWithFilter}
        onchange={(event) => {
          const value = event.currentTarget.value;
          table
            .getColumn("watchedWith")
            ?.setFilterValue(value === "all" ? undefined : value);
        }}
      >
        {#each tableWatchedWithOptions as person}
          <option value={person}>
            With: {person === "all" ? "anyone" : person}
          </option>
        {/each}
      </select>
      <div class="w-full sm:w-56">
        <label for="movie-title-table-search" class="sr-only">
          Search movie titles
        </label>
        <input
          id="movie-title-table-search"
          type="search"
          bind:value={titleSearch}
          placeholder="Search titles"
          class="border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-8 w-full min-w-0 rounded-none border bg-transparent px-2 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      </div>
    </div>
    <div class="flex items-center gap-3">
      {#if orderError}
        <div class="text-xs text-destructive">{orderError}</div>
      {/if}
      {#if isSavingOrder}
        <div class="text-xs text-muted-foreground">Saving order</div>
      {/if}
      <div class="text-xs text-muted-foreground">
        {visibleRows.length} of {tableData.length} movies
      </div>
      <button
        type="button"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        onclick={openAddDialog}
      >
        Add
      </button>
    </div>
  </div>
  <div
    class="min-h-0 flex-1 overflow-auto overscroll-contain"
    data-slot="table-container"
  >
    <table
      class="w-full table-fixed caption-bottom text-sm"
      style="min-width: 59rem; table-layout: fixed;"
    >
      <colgroup>
        <col style="width: 6rem;" />
        <col style="width: 22rem;" />
        <col style="width: 8rem;" />
        <col style="width: 6rem;" />
        <col style="width: 5.5rem;" />
        <col style="width: 8.5rem;" />
        <col style="width: 3rem;" />
      </colgroup>
      <thead class="sticky top-0 z-[1] bg-[var(--muted)] [&_tr]:border-b">
        <tr class="border-b transition-colors hover:bg-muted/50">
          <th
            class="h-10 px-2 text-left align-middle font-medium"
            style="width: 6rem;"
          >
            {@render sortButton("rank", "#")}
          </th>
          <th class="h-10 w-[22rem] max-w-[22rem] px-2 text-left align-middle font-medium">
            {@render sortButton("title", "Title")}
          </th>
          <th class="h-10 w-32 px-2 text-left align-middle font-medium">
            {@render sortButton("watchedOn", "Watched")}
          </th>
          <th class="h-10 w-24 px-2 text-left align-middle font-medium">
            {@render sortButton("language", "Language")}
          </th>
          <th class="h-10 px-2 text-left align-middle font-medium">
            {@render sortButton("status", "Status")}
          </th>
          <th class="h-10 px-2 text-left align-middle font-medium">
            {@render sortButton("watchedWith", "With")}
          </th>
          <th class="h-10 px-1 text-right align-middle font-medium"></th>
        </tr>
      </thead>
      <tbody class="[&_tr:last-child]:border-0">
        {#if visibleRows.length > 0}
          {#each visibleRows as row (row.id)}
            {@const entry = row.original}
            {@const isExpanded = expandedMovieIds.has(entry.movieId)}
            {@const canExpand = entry.watchCount > 1}
            <tr
              class={[
                "h-12 border-b transition-colors hover:bg-muted/50",
                draggedMovieId === entry.movieId ? "opacity-50" : "",
                dropTarget?.movieId === entry.movieId &&
                dropTarget.position === "before"
                  ? "shadow-[inset_0_2px_0_0_var(--foreground)]"
                  : "",
                dropTarget?.movieId === entry.movieId &&
                dropTarget.position === "after"
                  ? "shadow-[inset_0_-2px_0_0_var(--foreground)]"
                  : "",
                splicedMovieId === entry.movieId ? "movie-row-splice" : "",
              ]}
              ondragover={(event) => handleDragOver(event, entry.movieId)}
              ondrop={(event) => handleDrop(event, entry.movieId)}
            >
              <td class="h-12 p-2 align-middle">
                <div
                  class="grid w-[5.75rem] grid-cols-[1.25rem_2rem_2rem] items-center gap-1"
                >
                  {#if canReorder}
                    <button
                      type="button"
                      draggable={canDragReorder}
                      disabled={!canDragReorder}
                      aria-label={`Reorder ${entry.title}`}
                      title={canDragReorder ? "Drag to reorder" : "Saving order"}
                      class={[
                        "col-start-1 -ml-1 flex size-5 items-center justify-center text-muted-foreground leading-none transition-opacity ease-out",
                        draggedMovieId !== null
                          ? "opacity-35 duration-150"
                          : "opacity-100 duration-[650ms]",
                        canDragReorder
                          ? "cursor-grab hover:text-foreground active:cursor-grabbing"
                          : "cursor-default",
                      ]}
                      ondragstart={(event) =>
                        handleDragStart(event, entry.movieId)}
                      ondragend={handleDragEnd}
                    >
                      {@render gripIcon()}
                    </button>
                  {:else}
                    <span
                      aria-hidden="true"
                      class="col-start-1 -ml-1 block size-5 shrink-0"
                    ></span>
                  {/if}
                  {#if canExpand}
                    <button
                      type="button"
                      class="col-start-2 inline-flex h-6 w-8 items-center justify-center gap-0.5 rounded-none px-1 text-[11px] leading-none text-muted-foreground hover:bg-transparent hover:text-foreground"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${entry.title} watch history`}
                      title={isExpanded ? "Collapse watch history" : "Expand watch history"}
                      onclick={() => toggleExpandedMovie(entry.movieId)}
                    >
                      {#if isExpanded}
                        {@render chevronDownIcon()}
                      {:else}
                        {@render chevronRightIcon()}
                      {/if}
                      <span class="tabular-nums">{entry.watchCount}</span>
                    </button>
                  {:else}
                    <span
                      aria-hidden="true"
                      class="col-start-2 block h-6 w-8 shrink-0"
                    ></span>
                  {/if}
                  <span class="col-start-3 text-muted-foreground tabular-nums">
                    {entry.rank}
                  </span>
                </div>
              </td>
              <td class="h-12 p-2 align-middle">
                <a
                  href={`/movies/${entry.id}`}
                  class={[
                    "block max-w-[22rem] truncate hover:underline",
                    entry.status !== "watched" ? "font-light italic" : "font-medium",
                  ]}
                  title={entry.title}
                >
                  {entry.title}
                </a>
              </td>
              <td class="h-12 p-2 align-middle">
                {@render editableCellButton(
                  entry,
                  "watchedOn",
                  isActiveEditTarget(entry, "watchedOn"),
                  entry.watchedDateDisplay,
                )}
              </td>
              <td class="h-12 p-2 align-middle">
                {@render editableCellButton(
                  entry,
                  "language",
                  isActiveEditTarget(entry, "language"),
                  entry.language,
                )}
              </td>
              <td class="h-12 p-2 align-middle">
                <span
                  class="inline-flex min-w-12 justify-center border border-[var(--border)] px-1.5 py-0.5 text-[11px] uppercase tracking-[0.18em]"
                >
                  {entry.status}
                </span>
              </td>
              <td class="h-12 p-2 align-middle">
                {@render editableCellButton(
                  entry,
                  "watchedWith",
                  isActiveEditTarget(entry, "watchedWith"),
                  entry.watchedWith.join(", ") || "-",
                )}
              </td>
              <td class="h-12 px-1 py-2 align-middle">
                <div class="flex justify-end">
                  {#if entry.watchCount === 1}
                    {@render deleteButton(entry.title, entry.watchEntryId)}
                  {:else}
                    <button
                      type="button"
                      class="inline-flex size-8 cursor-not-allowed items-center justify-center rounded-md text-[var(--muted-foreground)] opacity-35"
                      aria-label={`Delete ${entry.title} entries individually from its watch history`}
                      title="Delete individual entries from the watch history first"
                      disabled
                    >
                      {@render xIcon()}
                      <span class="sr-only">
                        Delete individual entries from the watch history first
                      </span>
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
            {#if isExpanded}
              <tr class="bg-[var(--muted)]/30 hover:bg-[var(--muted)]/30">
                <td colspan="7" class="p-0">
                  {@render movieWatchHistory(entry)}
                </td>
              </tr>
            {/if}
          {/each}
        {:else}
          <tr class="border-b transition-colors hover:bg-muted/50">
            <td colspan="7" class="h-24 p-2 text-center text-sm text-muted-foreground">
              No movies match the current filters.
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</section>

{#if editTarget}
  <EditMovieEntryPanel
    target={editTarget}
    {userId}
    {watchedWithOptions}
    onCancel={() => (editTarget = null)}
  />
{/if}

{#if addDialogOpen}
  <div class="fixed inset-0 z-40 bg-black/35" role="presentation"></div>
  <div class="fixed inset-0 z-50 grid place-items-center p-4">
    <div
      class="max-h-[90vh] w-[min(96vw,72rem)] max-w-none overflow-visible rounded-none border border-[var(--border)] bg-[var(--background)] p-0 text-[var(--foreground)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
      role="dialog"
      aria-modal="true"
      aria-label="Add Movie"
    >
      <div class="border-b border-[var(--border)] px-4 py-3">
        <h2
          class="select-none text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]"
        >
          Add Movie
        </h2>
      </div>
      <form onsubmit={handleAddSubmit} class="grid min-w-0 gap-0">
        <div class="grid min-w-0 gap-3 overflow-x-auto px-4 py-4">
          <div
            class="hidden grid-cols-[minmax(12rem,1.5fr)_14.5rem_minmax(8rem,0.8fr)_8rem_minmax(13rem,1.2fr)_2.25rem] gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:grid"
          >
            <span>Title</span>
            <span>Date Watched</span>
            <span>Language</span>
            <span>Status</span>
            <span>Watched With</span>
            <span></span>
          </div>
          <div class="grid gap-2">
            {#each addRows as row, index (row.id)}
              <div
                class="grid gap-2 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(12rem,1.5fr)_14.5rem_minmax(8rem,0.8fr)_8rem_minmax(13rem,1.2fr)_2.25rem] lg:items-start lg:border-b-0 lg:pb-0"
              >
                <input type="hidden" name="movieRowId" value={row.id} />
                <div class="grid gap-1.5">
                  <label
                    for={`movie-title-${row.id}`}
                    class="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:sr-only"
                  >
                    Title
                  </label>
                  <MovieTitleSearchField
                    id={`movie-title-${row.id}`}
                    titleName={`title:${row.id}`}
                    tmdbIdName={`tmdbId:${row.id}`}
                    {userId}
                    ariaLabel={`Row ${index + 1} title`}
                  />
                </div>
                <div class="grid gap-1.5">
                  <label
                    for={`watched-on-${row.id}`}
                    class="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:sr-only"
                  >
                    Date Watched
                  </label>
                  <div class="grid grid-cols-[5.25rem_minmax(0,1fr)]">
                    <input
                      type="hidden"
                      name={`watchedDatePrecision:${row.id}`}
                      value={row.watchedDatePrecision}
                    />
                    <select
                      class="h-9 w-full rounded-none border border-r-0 border-[var(--border)] bg-[var(--background)] px-2 text-base shadow-none md:text-sm"
                      aria-label={`Row ${index + 1} date precision`}
                      value={row.watchedDatePrecision}
                      onchange={(event) =>
                        updateMovieRow(row.id, {
                          watchedDatePrecision: event.currentTarget
                            .value as WatchDatePrecision,
                        })}
                    >
                      <option value="day">Date</option>
                      <option value="year">Year</option>
                    </select>
                    {#if row.watchedDatePrecision === "day"}
                      <input
                        id={`watched-on-${row.id}`}
                        name={`watchedOn:${row.id}`}
                        type="date"
                        value={row.watchedOn}
                        required
                        class="border-input h-9 w-full min-w-0 rounded-none border border-[var(--border)] bg-transparent px-2 font-mono text-base tabular-nums shadow-none md:text-sm"
                        oninput={(event) =>
                          updateMovieRow(row.id, {
                            watchedOn: event.currentTarget.value,
                          })}
                      />
                    {:else}
                      <input
                        id={`watched-on-${row.id}`}
                        name={`watchedYear:${row.id}`}
                        type="text"
                        value={row.watchedYear}
                        placeholder="YYYY"
                        inputmode="numeric"
                        maxlength="4"
                        required
                        autocomplete="off"
                        class="border-input h-9 w-24 min-w-0 rounded-none border border-[var(--border)] bg-transparent px-2 font-mono text-base tabular-nums shadow-none md:text-sm"
                        onbeforeinput={preventNonYearDigit}
                        onpaste={(event) => pasteYearDigits(event, row.id)}
                        oninput={(event) =>
                          updateMovieRow(row.id, {
                            watchedYear: formatYearDigits(
                              event.currentTarget.value,
                            ),
                          })}
                      />
                    {/if}
                  </div>
                </div>
                <div class="grid gap-1.5">
                  <label
                    for={`language-${row.id}`}
                    class="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:sr-only"
                  >
                    Language
                  </label>
                  <input
                    id={`language-${row.id}`}
                    name={`languageWatched:${row.id}`}
                    placeholder="English"
                    class="border-input h-9 w-full min-w-0 rounded-none border bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm"
                  />
                </div>
                <div class="grid gap-1.5">
                  <span
                    class="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:sr-only"
                  >
                    Status
                  </span>
                  <input
                    type="hidden"
                    name={`status:${row.id}`}
                    value={row.status}
                  />
                  <select
                    class="h-9 rounded-none border border-[var(--border)] bg-[var(--background)] px-3 text-base shadow-none md:text-sm"
                    aria-label={`Row ${index + 1} status`}
                    value={row.status}
                    onchange={(event) =>
                      updateMovieRow(row.id, {
                        status: event.currentTarget.value as WatchStatus,
                      })}
                  >
                    {#each STATUS_OPTIONS as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                </div>
                <div class="grid min-w-0 gap-1.5">
                  <label
                    for={`watched-with-${row.id}`}
                    class="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)] lg:sr-only"
                  >
                    Watched With
                  </label>
                  <WatchedWithSelect
                    id={`watched-with-${row.id}`}
                    name={`watchedWith:${row.id}`}
                    options={watchedWithOptions}
                    value={row.watchedWith}
                    onChange={(watchedWith) =>
                      updateMovieRow(row.id, { watchedWith })}
                  />
                </div>
                <div class="flex justify-end lg:pt-0">
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-none text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    disabled={addRows.length === 1}
                    aria-label={`Remove row ${index + 1}`}
                    title="Remove row"
                    onclick={() => removeMovieRow(row.id)}
                  >
                    {@render xIcon()}
                  </button>
                </div>
              </div>
            {/each}
          </div>
          {#if addError}
            <p
              class="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]"
            >
              {addError}
            </p>
          {/if}
        </div>
        <div
          class="flex justify-between rounded-none border-t border-[var(--border)] bg-transparent px-4 py-3"
        >
          <button
            type="button"
            class="inline-flex h-9 items-center justify-center gap-2 rounded-none border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
            onclick={addMovieRow}
          >
            + Add Movie
          </button>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              onclick={() => (addDialogOpen = false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addPending}
              class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {addPending ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if deleteTarget}
  <div class="fixed inset-0 z-40 bg-black/35" role="presentation"></div>
  <div class="fixed inset-0 z-50 grid place-items-center p-4">
    <div
      class="max-w-md rounded-none border border-[var(--border)] bg-[var(--background)] p-0 text-[var(--foreground)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm Delete"
    >
      <div class="border-b border-[var(--border)] px-4 py-3">
        <h2
          class="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]"
        >
          Confirm Delete
        </h2>
      </div>
      <div class="grid gap-4 px-4 py-4 text-sm">
        <p>
          Delete <span class="font-medium">{deleteTarget.title}</span> from your
          watched collection.
        </p>
        {#if deleteError}
          <p
            class="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]"
          >
            {deleteError}
          </p>
        {/if}
      </div>
      <div
        class="flex justify-end gap-2 rounded-none border-t border-[var(--border)] bg-transparent px-4 py-3"
      >
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          disabled={deletePending}
          onclick={() => (deleteTarget = null)}
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
          disabled={deletePending}
          onclick={handleDelete}
        >
          {deletePending ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
{/if}

{#snippet sortButton(columnId: string, label: string)}
  <button
    type="button"
    class={[
      "-ml-2 inline-flex h-7 items-center gap-1 px-2 text-[11px] uppercase tracking-[0.18em] hover:bg-transparent hover:text-foreground",
      table.getColumn(columnId)?.getIsSorted()
        ? "font-semibold text-foreground"
        : "text-muted-foreground",
    ]}
    onclick={() => toggleSort(columnId)}
  >
    {label}
    {#if table.getColumn(columnId)?.getIsSorted() === "asc"}
      {@render sortAscIcon()}
    {:else if table.getColumn(columnId)?.getIsSorted() === "desc"}
      {@render sortDescIcon()}
    {:else}
      {@render sortIdleIcon()}
    {/if}
  </button>
{/snippet}

{#snippet sortAscIcon()}
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
    <path d="m18 15-6-6-6 6" />
  </svg>
{/snippet}

{#snippet sortDescIcon()}
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
    <path d="m6 9 6 6 6-6" />
  </svg>
{/snippet}

{#snippet sortIdleIcon()}
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
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </svg>
{/snippet}

{#snippet gripIcon()}
  <svg
    aria-hidden="true"
    class="size-3.5"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <circle cx="9" cy="6" r="1.25" />
    <circle cx="15" cy="6" r="1.25" />
    <circle cx="9" cy="12" r="1.25" />
    <circle cx="15" cy="12" r="1.25" />
    <circle cx="9" cy="18" r="1.25" />
    <circle cx="15" cy="18" r="1.25" />
  </svg>
{/snippet}

{#snippet chevronRightIcon()}
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
    <path d="m9 18 6-6-6-6" />
  </svg>
{/snippet}

{#snippet chevronDownIcon()}
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
    <path d="m6 9 6 6 6-6" />
  </svg>
{/snippet}

{#snippet editableCellButton(
  entry: EditableMovieEntry,
  field: EditableMovieEntryField,
  active: boolean,
  value: string,
)}
  {#if entry.canEdit}
    <button
      type="button"
      class={[
        "block w-full min-w-0 truncate px-1 py-0.5 text-left text-muted-foreground hover:text-foreground",
        active ? "bg-[var(--muted)] text-foreground" : "",
      ]}
      onclick={(event) => startEdit(event, entry, field)}
    >
      {value}
    </button>
  {:else}
    <span class="text-muted-foreground">{value}</span>
  {/if}
{/snippet}

{#snippet deleteButton(title: string, watchEntryId: string)}
  <button
    type="button"
    class="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-transparent hover:text-[var(--destructive)]"
    aria-label={`Delete ${title}`}
    title={`Delete ${title}`}
    onclick={() => {
      deleteTarget = { title, watchEntryId };
      deleteError = null;
    }}
  >
    {@render xIcon()}
    <span class="sr-only">Delete</span>
  </button>
{/snippet}

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

{#snippet movieWatchHistory(entry: MovieLedgerEntry)}
  <div class="ml-16 overflow-x-auto border-l border-[var(--border)]">
    <div class="min-w-[42rem]">
      <div
        class="grid grid-cols-[8rem_7rem_6rem_minmax(12rem,1fr)_3rem] items-center border-b border-[var(--border)] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
      >
        <div>Watched</div>
        <div>Language</div>
        <div>Status</div>
        <div>With</div>
        <div></div>
      </div>
      {#each entry.watchEntries as watchEntry (watchEntry.watchEntryId)}
        <div
          class="grid grid-cols-[8rem_7rem_6rem_minmax(12rem,1fr)_3rem] items-center border-b border-[var(--border)] px-3 py-1.5 text-sm last:border-b-0"
        >
          {@render editableCellButton(
            watchEntry,
            "watchedOn",
            isActiveEditTarget(watchEntry, "watchedOn"),
            watchEntry.watchedDateDisplay,
          )}
          {@render editableCellButton(
            watchEntry,
            "language",
            isActiveEditTarget(watchEntry, "language"),
            watchEntry.language,
          )}
          <span
            class="inline-flex min-w-12 justify-center border border-[var(--border)] px-1.5 py-0.5 text-[11px] uppercase tracking-[0.18em]"
          >
            {watchEntry.status}
          </span>
          {@render editableCellButton(
            watchEntry,
            "watchedWith",
            isActiveEditTarget(watchEntry, "watchedWith"),
            watchEntry.watchedWith.join(", ") || "-",
          )}
          <div class="flex justify-end">
            {@render deleteButton(
              `${entry.title} (${watchEntry.watchedDateDisplay})`,
              watchEntry.watchEntryId,
            )}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/snippet}
