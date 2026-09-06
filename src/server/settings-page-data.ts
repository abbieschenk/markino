import { asc, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { userDefaultWatchParticipants, users } from "@/db/schema";

export async function getSettingsPageData(userId: string) {
  const [watchedWithOptions, defaultWatchedWith] = await Promise.all([
    db
      .select({ handle: users.handle })
      .from(users)
      .where(ne(users.id, userId))
      .orderBy(asc(users.handle)),
    db
      .select({ handle: users.handle })
      .from(userDefaultWatchParticipants)
      .innerJoin(
        users,
        eq(userDefaultWatchParticipants.participantUserId, users.id),
      )
      .where(eq(userDefaultWatchParticipants.userId, userId))
      .orderBy(asc(users.handle)),
  ]);

  return {
    defaultWatchedWith: defaultWatchedWith.map((user) => user.handle),
    watchedWithOptions: watchedWithOptions.map((user) => user.handle),
  };
}
