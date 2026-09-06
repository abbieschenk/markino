import type { LocalUser } from "@/lib/local-profiles";

export const CURRENT_USER_STORAGE_KEY = "markino.currentUserId";
export const CURRENT_USER_COOKIE = "markino_current_user_id";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function persistSelectedProfile(userId: string) {
  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId);
  document.cookie = `${CURRENT_USER_COOKIE}=${encodeURIComponent(userId)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function clearSelectedProfile() {
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  document.cookie = `${CURRENT_USER_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function isKnownProfileId(profiles: LocalUser[], userId: string | null) {
  return Boolean(userId && profiles.some((profile) => profile.id === userId));
}

