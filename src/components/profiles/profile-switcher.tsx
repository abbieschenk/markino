"use client";

import { Check, Plus, UserCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LocalUser } from "@/lib/local-profiles";
import {
  CURRENT_USER_STORAGE_KEY,
  clearSelectedProfile,
  isKnownProfileId,
  persistSelectedProfile,
} from "@/components/profiles/profile-selection";
import { ProfileCreateForm } from "@/components/profiles/profile-create-form";

type ProfileSwitcherProps = {
  currentUser: LocalUser | null;
  profiles: LocalUser[];
};

export function ProfileSwitcher({ currentUser, profiles }: ProfileSwitcherProps) {
  const [isCreating, setIsCreating] = useState(false);
  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  );

  useEffect(() => {
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
  }, [currentUser, profiles]);

  function selectProfile(userId: string) {
    if (!profileById.has(userId)) {
      return;
    }

    persistSelectedProfile(userId);
    window.location.reload();
  }

  return (
    <DropdownMenu onOpenChange={(open) => !open && setIsCreating(false)}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-none px-2"
        >
          <UserCircle className="size-4" weight="regular" />
          {currentUser?.handle ?? "Profile"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-none border-[var(--border)] bg-[var(--background)] p-1 shadow-[0_16px_48px_rgba(0,0,0,0.16)]"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] uppercase tracking-[0.18em]">
          Local Profile
        </DropdownMenuLabel>
        {profiles.length > 0 ? (
          profiles.map((profile) => (
            <DropdownMenuItem
              key={profile.id}
              className="rounded-none px-2 py-2"
              onSelect={() => selectProfile(profile.id)}
            >
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate text-sm font-medium">
                  {profile.displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  @{profile.handle}
                </span>
              </span>
              {profile.id === currentUser?.id ? (
                <Check className="size-4" weight="regular" />
              ) : null}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            No profiles yet.
          </div>
        )}
        <DropdownMenuSeparator />
        {isCreating ? (
          <div className="px-2 py-2">
            <ProfileCreateForm />
          </div>
        ) : (
          <DropdownMenuItem
            className="rounded-none px-2 py-2"
            onSelect={(event) => {
              event.preventDefault();
              setIsCreating(true);
            }}
          >
            <Plus className="size-4" weight="regular" />
            Create Profile
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
