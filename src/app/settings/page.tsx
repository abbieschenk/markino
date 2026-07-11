import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq, ne } from "drizzle-orm";

import { SettingsWatchedWithForm } from "@/components/settings/settings-watched-with-form";
import { db } from "@/db";
import { userDefaultWatchParticipants, users } from "@/db/schema";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [watchedWithOptions, defaultWatchedWith] = await Promise.all([
    db
      .select({ handle: users.handle })
      .from(users)
      .where(ne(users.id, session.user.id))
      .orderBy(asc(users.handle)),
    db
      .select({ handle: users.handle })
      .from(userDefaultWatchParticipants)
      .innerJoin(
        users,
        eq(userDefaultWatchParticipants.participantUserId, users.id),
      )
      .where(eq(userDefaultWatchParticipants.userId, session.user.id))
      .orderBy(asc(users.handle)),
  ]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-medium tracking-[-0.03em]">Settings</h1>
        <p className="max-w-2xl text-sm text-[var(--muted-foreground)]">
          Defaults used when adding new movie entries.
        </p>
      </header>
      <SettingsWatchedWithForm
        defaultWatchedWith={defaultWatchedWith.map((user) => user.handle)}
        watchedWithOptions={watchedWithOptions.map((user) => user.handle)}
      />
    </section>
  );
}
