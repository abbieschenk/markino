<script lang="ts">
  import { onMount } from "svelte";

  import type { LocalUser } from "@/lib/local-profiles";
  import {
    CURRENT_USER_STORAGE_KEY,
    clearSelectedProfile,
    isKnownProfileId,
    persistSelectedProfile,
  } from "@/components/profiles/profile-selection";
  import ProfileCreateForm from "@/components/profiles/profile-create-form.svelte";

  type Props = {
    profiles: LocalUser[];
  };

  let { profiles }: Props = $props();
  let showCreateForm = $state(profiles.length === 0);

  onMount(() => {
    const storedUserId = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);

    if (storedUserId && isKnownProfileId(profiles, storedUserId)) {
      persistSelectedProfile(storedUserId);
      window.location.reload();
      return;
    }

    if (storedUserId) {
      clearSelectedProfile();
    }
  });

  function selectProfile(userId: string) {
    if (!isKnownProfileId(profiles, userId)) {
      return;
    }

    persistSelectedProfile(userId);
    window.location.reload();
  }
</script>

{#if profiles.length > 0}
  <div class="grid gap-2">
    {#each profiles as profile (profile.id)}
      <button
        type="button"
        class="inline-flex h-auto items-center justify-start gap-2 rounded-none border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus-visible:border-[var(--ring)] focus-visible:ring-[var(--ring)]/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
        onclick={() => selectProfile(profile.id)}
      >
        <span class="grid gap-0.5 text-left">
          <span class="font-medium">{profile.displayName}</span>
          <span class="text-xs text-muted-foreground">@{profile.handle}</span>
        </span>
      </button>
    {/each}
  </div>
{/if}

{#if showCreateForm}
  <div class="border-t border-[var(--border)] pt-4">
    <ProfileCreateForm />
  </div>
{:else}
  <div class="flex justify-end border-t border-[var(--border)] pt-4">
    <button
      type="button"
      class="inline-flex h-9 items-center justify-center gap-2 rounded-none px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus-visible:border-[var(--ring)] focus-visible:ring-[var(--ring)]/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
      onclick={() => (showCreateForm = true)}
    >
      Create Profile
    </button>
  </div>
{/if}
