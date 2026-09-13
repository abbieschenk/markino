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
    currentUser: LocalUser | null;
    profiles: LocalUser[];
  };

  let { currentUser, profiles }: Props = $props();
  let open = $state(false);
  let isCreating = $state(false);

  onMount(() => {
    const storedUserId = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);

    if (storedUserId && isKnownProfileId(profiles, storedUserId)) {
      if (storedUserId !== currentUser?.id) {
        persistSelectedProfile(storedUserId);
        window.location.reload();
      }
      return;
    }

    if (currentUser) {
      window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentUser.id);
      return;
    }

    if (storedUserId) {
      clearSelectedProfile();
    }
  });

  function closeMenu() {
    open = false;
    isCreating = false;
  }

  function selectProfile(userId: string) {
    if (!isKnownProfileId(profiles, userId)) {
      return;
    }

    persistSelectedProfile(userId);
    window.location.reload();
  }
</script>

<div
  class="relative"
  onfocusout={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      closeMenu();
    }
  }}
>
  <button
    type="button"
    class="inline-flex h-8 items-center justify-center gap-1.5 rounded-none border border-[var(--input)] bg-[var(--background)] px-2 text-sm font-medium shadow-xs transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus-visible:border-[var(--ring)] focus-visible:ring-[var(--ring)]/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
    aria-expanded={open}
    aria-haspopup="menu"
    onclick={() => {
      open = !open;
      if (!open) {
        isCreating = false;
      }
    }}
  >
    {@render userCircleIcon()}
    {currentUser?.handle ?? "Profile"}
  </button>

  {#if open}
    <div
      class="absolute right-0 top-full z-50 mt-1 w-72 border border-[var(--border)] bg-[var(--background)] p-1 shadow-[0_16px_48px_rgba(0,0,0,0.16)]"
      role="menu"
      tabindex="-1"
      onkeydown={(event) => {
        if (event.key === "Escape") {
          closeMenu();
        }
      }}
    >
      <div class="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em]">
        Local Profile
      </div>
      {#if profiles.length > 0}
        {#each profiles as profile (profile.id)}
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-none px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus:bg-[var(--accent)] focus:text-[var(--accent-foreground)]"
            role="menuitem"
            onclick={() => selectProfile(profile.id)}
          >
            <span class="grid min-w-0 flex-1 gap-0.5">
              <span class="truncate text-sm font-medium">{profile.displayName}</span>
              <span class="truncate text-xs text-muted-foreground">
                @{profile.handle}
              </span>
            </span>
            {#if profile.id === currentUser?.id}
              {@render checkIcon()}
            {/if}
          </button>
        {/each}
      {:else}
        <div class="px-2 py-2 text-sm text-muted-foreground">No profiles yet.</div>
      {/if}
      <div class="-mx-1 my-1 h-px bg-[var(--border)]"></div>
      {#if isCreating}
        <div class="px-2 py-2">
          <ProfileCreateForm />
        </div>
      {:else}
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-none px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus:bg-[var(--accent)] focus:text-[var(--accent-foreground)]"
          role="menuitem"
          onclick={() => (isCreating = true)}
        >
          {@render plusIcon()}
          Create Profile
        </button>
      {/if}
    </div>
  {/if}
</div>

{#snippet userCircleIcon()}
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
    <path d="M18 20a6 6 0 0 0-12 0" />
    <circle cx="12" cy="10" r="4" />
    <circle cx="12" cy="12" r="10" />
  </svg>
{/snippet}

{#snippet checkIcon()}
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
    <path d="M20 6 9 17l-5-5" />
  </svg>
{/snippet}

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
