import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { MoviesScreen } from "@/components/movies/MoviesScreen";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Movies",
};

export default async function MoviesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <MoviesScreen
      userId={session.user.id}
      canSyncMetadata={session.user.role === "superadmin"}
    />
  );
}
