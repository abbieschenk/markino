import { headers } from "next/headers";
import Link from "next/link";

import { MoviesScreen } from "@/components/movies/MoviesScreen";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user?.id) {
    return <MoviesScreen userId={session.user.id} />;
  }

  return (
    <section className="grid gap-8 py-12 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base flex flex-col gap-2">
            <p>
              Markino is a watch log for personal and collaborative movie
              tracking.
            </p>
            <p>It is not yet available for public signup.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center border border-[var(--border)] px-3 font-medium hover:bg-[var(--accent)]"
          >
            Create Account
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex h-9 items-center border border-transparent px-3 text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
