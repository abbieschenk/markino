"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { LocalUser } from "@/lib/local-profiles";
import {
  CURRENT_USER_STORAGE_KEY,
  clearSelectedProfile,
  isKnownProfileId,
  persistSelectedProfile,
} from "@/components/profiles/profile-selection";
import { ProfileCreateForm } from "@/components/profiles/profile-create-form";

type ProfileSelectionPanelProps = {
  profiles: LocalUser[];
};

export function ProfileSelectionPanel({ profiles }: ProfileSelectionPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(profiles.length === 0);

  useEffect(() => {
    const storedUserId = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);

    if (storedUserId && isKnownProfileId(profiles, storedUserId)) {
      persistSelectedProfile(storedUserId);
      window.location.reload();
      return;
    }

    if (storedUserId) {
      clearSelectedProfile();
    }
  }, [profiles]);

  function selectProfile(userId: string) {
    persistSelectedProfile(userId);
    window.location.reload();
  }

  return (
    <section className="mx-auto grid max-w-xl gap-4 border border-[var(--border)] p-4">
      <div className="space-y-1">
        <h1 className="text-base font-medium">Select Profile</h1>
        <p className="text-sm text-muted-foreground">
          Choose a local profile to load its movie ledger.
        </p>
      </div>
      {profiles.length > 0 ? (
        <div className="grid gap-2">
          {profiles.map((profile) => (
            <Button
              key={profile.id}
              type="button"
              variant="outline"
              className="h-auto justify-start rounded-none px-3 py-2"
              onClick={() => selectProfile(profile.id)}
            >
              <span className="grid gap-0.5 text-left">
                <span className="font-medium">{profile.displayName}</span>
                <span className="text-xs text-muted-foreground">
                  @{profile.handle}
                </span>
              </span>
            </Button>
          ))}
        </div>
      ) : null}
      {showCreateForm ? (
        <div className="border-t border-[var(--border)] pt-4">
          <ProfileCreateForm />
        </div>
      ) : (
        <div className="flex justify-end border-t border-[var(--border)] pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowCreateForm(true)}
          >
            Create Profile
          </Button>
        </div>
      )}
    </section>
  );
}
