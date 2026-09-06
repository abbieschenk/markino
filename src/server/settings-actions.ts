import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { userDefaultWatchParticipants, users } from "@/db/schema";
import { getLocalProfileById } from "@/lib/local-profiles";

type SettingsActionResult = {
  status: "idle" | "error" | "success";
  message: string | null;
};

export async function updateDefaultWatchedWith(
  formData: FormData,
): Promise<SettingsActionResult> {
  const profile = await getLocalProfileById(String(formData.get("userId") ?? ""));

  if (!profile) {
    return {
      status: "error",
      message: "Select a profile to update settings.",
    };
  }

  const handles = Array.from(
    new Set(
      formData
        .getAll("defaultWatchedWith")
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean),
    ),
  ).filter((handle) => handle !== profile.handle);

  const participantUsers =
    handles.length > 0
      ? await db
          .select({ id: users.id, handle: users.handle })
          .from(users)
          .where(inArray(users.handle, handles))
      : [];

  if (participantUsers.length !== handles.length) {
    return {
      status: "error",
      message: "One or more selected handles could not be found.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(userDefaultWatchParticipants)
        .where(eq(userDefaultWatchParticipants.userId, profile.id));

      if (participantUsers.length > 0) {
        await tx.insert(userDefaultWatchParticipants).values(
          participantUsers.map((user) => ({
            userId: profile.id,
            participantUserId: user.id,
          })),
        );
      }
    });
  } catch (error) {
    console.error("Failed to update default watched with setting", error);

    return {
      status: "error",
      message: "Unable to update settings.",
    };
  }

      
  return {
    status: "success",
    message: "Settings saved.",
  };
}
