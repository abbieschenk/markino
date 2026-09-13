<script lang="ts">
  import { actions } from "astro:actions";

  import WatchedWithSelect from "@/components/movies/watched-with-select.svelte";
  import { getActionData } from "@/lib/action-result";

  type Props = {
    defaultWatchedWith: string[];
    userId: string;
    watchedWithOptions: string[];
  };

  type SettingsActionState = {
    status: "idle" | "error" | "success";
    message: string | null;
  };

  let { defaultWatchedWith, userId, watchedWithOptions }: Props = $props();
  let pending = $state(false);
  let watchedWith = $state([...defaultWatchedWith]);
  let state = $state<SettingsActionState>({
    status: "idle",
    message: null,
  });

  async function submitSettings(event: SubmitEvent) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const formData = new FormData(form);
    formData.set("userId", userId);

    pending = true;
    state = {
      status: "idle",
      message: null,
    };

    try {
      state = await getActionData(actions.updateDefaultWatchedWith(formData));
    } catch (error) {
      console.error("Failed to update default watched with setting", error);
      state = {
        status: "error",
        message: "Unable to save default watched with setting.",
      };
    } finally {
      pending = false;
    }
  }
</script>

<form onsubmit={submitSettings} class="grid gap-4 border border-[var(--border)] p-4">
  <div class="grid gap-1.5">
    <label
      for="default-watched-with"
      class="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
    >
      Default Watched With
    </label>
    <WatchedWithSelect
      id="default-watched-with"
      name="defaultWatchedWith"
      options={watchedWithOptions}
      value={watchedWith}
      onChange={(nextWatchedWith) => (watchedWith = nextWatchedWith)}
    />
  </div>
  {#if state.message}
    <p
      class={state.status === "error"
        ? "border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]"
        : "border border-[var(--border)] bg-[var(--accent)] px-3 py-2 text-sm text-[var(--muted-foreground)]"}
    >
      {state.message}
    </p>
  {/if}
  <div class="flex justify-end">
    <button
      type="submit"
      disabled={pending}
      class="inline-flex h-9 items-center justify-center gap-2 rounded-none bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] shadow-xs transition-colors hover:bg-[var(--primary)]/90 focus-visible:border-[var(--ring)] focus-visible:ring-[var(--ring)]/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  </div>
</form>
