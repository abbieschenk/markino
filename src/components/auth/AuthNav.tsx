"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

export function AuthNav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    const result = await authClient.signOut();

    setIsSigningOut(false);

    if (result.error) {
      return;
    }

    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  if (isPending) {
    return (
      <div className="px-2 py-1 text-sm text-[var(--muted-foreground)]">
        Session...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-1 text-sm">
        <Link
          href="/sign-in"
          className="px-2 py-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="px-2 py-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-[var(--muted-foreground)] sm:inline">
        Signed in
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isSigningOut}
        onClick={handleSignOut}
      >
        {isSigningOut ? "Logging Out..." : "Log Out"}
      </Button>
    </div>
  );
}
