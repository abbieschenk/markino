<script lang="ts">
  type Counts = Record<string, number>;
  type Preview = { exportedAt: string; includesTmdbMetadata: boolean; counts: Counts };

  let includeTmdbMetadata = $state(false);
  let backup: unknown = $state(null);
  let fileName = $state("");
  let preview: Preview | null = $state(null);
  let confirmation = $state("");
  let pending = $state(false);
  let message = $state("");
  let isError = $state(false);

  async function readResponse(response: Response) {
    const result = (await response.json()) as { error?: string; preview?: Preview; success?: boolean };
    if (!response.ok) throw new Error(result.error ?? "The request failed.");
    return result;
  }

  async function selectFile(event: Event) {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
    const file = input.files[0];
    pending = true; message = "Validating backup…"; isError = false; preview = null; backup = null; confirmation = ""; fileName = file.name;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const result = await readResponse(await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intent: "preview", backup: parsed }) }));
      backup = parsed; preview = result.preview ?? null; message = "Backup validated successfully.";
    } catch (error) {
      isError = true; message = error instanceof Error ? error.message : "Unable to validate the backup.";
    } finally { pending = false; }
  }

  async function restore() {
    if (!backup || confirmation !== "REPLACE") return;
    pending = true; isError = false; message = "Replacing installation data…";
    try {
      await readResponse(await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intent: "restore", confirmation, backup }) }));
      message = "Backup restored. Reloading…";
      window.location.reload();
    } catch (error) {
      isError = true; message = error instanceof Error ? error.message : "Unable to restore the backup."; pending = false;
    }
  }
</script>

<section class="grid gap-5 border border-[var(--border)] p-4" aria-labelledby="data-backup-heading">
  <div class="grid gap-1">
    <h2 id="data-backup-heading" class="text-base font-medium">Data backup</h2>
    <p class="text-sm text-[var(--muted-foreground)]">Export every profile and watch record, or replace this installation from a validated backup.</p>
  </div>

  <div class="grid gap-3 border-t border-[var(--border)] pt-4">
    <h3 class="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Export</h3>
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" bind:checked={includeTmdbMetadata} class="size-4 accent-[var(--primary)]" />
      Include TMDB metadata
    </label>
    <p class="text-xs text-[var(--muted-foreground)]">Off by default. Titles and TMDB IDs are always retained so metadata can be synced again.</p>
    <div><a href={`/api/backup?includeTmdbMetadata=${includeTmdbMetadata}`} download class="inline-flex h-9 items-center bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90">Download backup</a></div>
  </div>

  <div class="grid gap-3 border-t border-[var(--border)] pt-4">
    <h3 class="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Restore</h3>
    <label class="grid gap-1.5 text-sm" for="backup-file"><span>Backup file</span><input id="backup-file" type="file" accept="application/json,.json" onchange={selectFile} disabled={pending} class="block w-full border border-[var(--input)] p-2 text-sm file:mr-3 file:border-0 file:bg-[var(--accent)] file:px-3 file:py-1.5" /></label>

    {#if preview}
      <div class="grid gap-3 border border-[var(--destructive)]/40 bg-[var(--destructive)]/5 p-3">
        <div><p class="font-medium">Validated backup: {fileName}</p><p class="text-xs text-[var(--muted-foreground)]">Exported {new Date(preview.exportedAt).toLocaleString()} · {preview.includesTmdbMetadata ? "Includes TMDB metadata" : "Lean backup"}</p></div>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
          {#each Object.entries(preview.counts).filter(([, count]) => count > 0) as [name, count]}
            <div class="flex justify-between gap-2"><dt class="text-[var(--muted-foreground)]">{name}</dt><dd class="font-mono">{count}</dd></div>
          {/each}
        </dl>
        <p class="text-sm font-medium text-[var(--destructive)]">Restoring permanently replaces all current profiles, movies, rankings, and settings.</p>
        <label class="grid gap-1.5 text-sm" for="restore-confirmation"><span>Type <strong>REPLACE</strong> to confirm</span><input id="restore-confirmation" bind:value={confirmation} autocomplete="off" class="h-9 border border-[var(--input)] bg-transparent px-3 font-mono outline-none focus:border-[var(--ring)]" /></label>
        <div><button type="button" onclick={restore} disabled={pending || confirmation !== "REPLACE"} class="inline-flex h-9 items-center bg-[var(--destructive)] px-4 text-sm font-medium text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-50">{pending ? "Restoring…" : "Replace all data"}</button></div>
      </div>
    {/if}

    {#if message}<p aria-live="polite" class={isError ? "border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]" : "border border-[var(--border)] bg-[var(--accent)] px-3 py-2 text-sm text-[var(--muted-foreground)]"}>{message}</p>{/if}
  </div>
</section>
