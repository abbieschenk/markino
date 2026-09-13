<script lang="ts">
  import { actions } from "astro:actions";

  import { getActionData } from "@/lib/action-result";
  import type { LocalUser } from "@/lib/local-profiles";
  import { persistSelectedProfile } from "@/components/profiles/profile-selection";

  type Props = {
    onCreated?: (profile: LocalUser) => void;
  };

  let { onCreated }: Props = $props();
  let handle = $state("");
  let displayName = $state("");
  let pending = $state(false);
  let message = $state<string | null>(null);

  async function submitProfile(event: SubmitEvent) {
    event.preventDefault();
    pending = true;
    message = null;

    try {
      const result = await getActionData(
        actions.createLocalProfile({ handle, displayName }),
      );

      if (result.status === "error") {
        message = result.message;
        return;
      }

      persistSelectedProfile(result.profile.id);
      onCreated?.(result.profile);
      window.location.reload();
    } catch (error) {
      console.error("Failed to create profile", error);
      message = "Unable to create profile.";
    } finally {
      pending = false;
    }
  }
</script>

<form onsubmit={submitProfile} class="grid gap-3">
  <div class="grid gap-1.5">
    <label
      for="profile-handle"
      class="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
    >
      Handle
    </label>
    <input
      id="profile-handle"
      bind:value={handle}
      oninput={() => (handle = handle.toLowerCase())}
      minlength="3"
      maxlength="32"
      pattern="[a-z0-9_-]+"
      autocomplete="off"
      required
      class="h-8 rounded-none border border-[var(--input)] bg-transparent px-2 text-base shadow-xs outline-none transition-[color,box-shadow] selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--ring)] focus-visible:ring-[var(--ring)]/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
    />
  </div>
  <div class="grid gap-1.5">
    <label
      for="profile-display-name"
      class="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
    >
      Display Name
    </label>
    <input
      id="profile-display-name"
      bind:value={displayName}
      maxlength="128"
      autocomplete="off"
      required
      class="h-8 rounded-none border border-[var(--input)] bg-transparent px-2 text-base shadow-xs outline-none transition-[color,box-shadow] selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--ring)] focus-visible:ring-[var(--ring)]/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
    />
  </div>
  {#if message}
    <p
      class="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-2 py-1.5 text-xs text-[var(--destructive)]"
    >
      {message}
    </p>
  {/if}
  <button
    type="submit"
    disabled={pending}
    class="inline-flex h-8 items-center justify-center gap-1.5 rounded-none bg-[var(--primary)] px-3 text-sm font-medium text-[var(--primary-foreground)] shadow-xs transition-colors hover:bg-[var(--primary)]/90 disabled:pointer-events-none disabled:opacity-50"
  >
    {pending ? "Creating..." : "Create Profile"}
  </button>
</form>
