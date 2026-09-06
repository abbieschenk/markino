import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

export const CURRENT_USER_COOKIE = "markino_current_user_id";

export type LocalUser = {
  id: string;
  handle: string;
  displayName: string;
  role: "user" | "admin" | "superadmin";
};

export type CreateLocalProfileResult =
  | {
      status: "success";
      message: string | null;
      profile: LocalUser;
    }
  | {
      status: "error";
      message: string;
      profile: null;
    };

const HANDLE_PATTERN = /^[a-z0-9_-]+$/;

export function normalizeHandle(value: string) {
  return value.trim().toLowerCase();
}

export function validateLocalProfileInput({
  displayName,
  handle,
}: {
  displayName: string;
  handle: string;
}) {
  const normalizedHandle = normalizeHandle(handle);
  const normalizedDisplayName = displayName.trim();

  if (normalizedHandle.length < 3 || normalizedHandle.length > 32) {
    return {
      status: "error" as const,
      message: "Handle must be between 3 and 32 characters.",
    };
  }

  if (!HANDLE_PATTERN.test(normalizedHandle)) {
    return {
      status: "error" as const,
      message:
        "Handle can only contain lowercase letters, numbers, underscores, and hyphens.",
    };
  }

  if (!normalizedDisplayName) {
    return {
      status: "error" as const,
      message: "Display name is required.",
    };
  }

  if (normalizedDisplayName.length > 128) {
    return {
      status: "error" as const,
      message: "Display name must be 128 characters or fewer.",
    };
  }

  return {
    status: "success" as const,
    profile: {
      displayName: normalizedDisplayName,
      handle: normalizedHandle,
    },
  };
}

export async function listLocalProfiles(): Promise<LocalUser[]> {
  return db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      role: users.role,
    })
    .from(users)
    .orderBy(asc(users.handle));
}

export async function getLocalProfileById(
  userId: string | null | undefined,
): Promise<LocalUser | null> {
  const normalizedUserId = userId?.trim();

  if (!normalizedUserId) {
    return null;
  }

  return (
    (await db.query.users.findFirst({
      where: eq(users.id, normalizedUserId),
      columns: {
        id: true,
        handle: true,
        displayName: true,
        role: true,
      },
    })) ?? null
  );
}

export async function createLocalProfile(input: {
  displayName: string;
  handle: string;
}): Promise<CreateLocalProfileResult> {
  const validation = validateLocalProfileInput(input);

  if (validation.status === "error") {
    return {
      status: "error",
      message: validation.message,
      profile: null,
    };
  }

  const existingProfile = await db.query.users.findFirst({
    where: eq(users.handle, validation.profile.handle),
    columns: { id: true },
  });

  if (existingProfile) {
    return {
      status: "error",
      message: "Handle is already taken.",
      profile: null,
    };
  }

  try {
    const [profile] = await db
      .insert(users)
      .values({
        displayName: validation.profile.displayName,
        handle: validation.profile.handle,
        role: "user",
      })
      .returning({
        id: users.id,
        handle: users.handle,
        displayName: users.displayName,
        role: users.role,
      });

    return {
      status: "success",
      message: "Profile created.",
      profile,
    };
  } catch (error) {
    console.error("Failed to create local profile", error);

    return {
      status: "error",
      message: "Unable to create profile.",
      profile: null,
    };
  }
}
