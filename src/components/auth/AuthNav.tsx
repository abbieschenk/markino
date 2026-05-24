"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

type AuthNavProps = {
  signupsEnabled: boolean;
};

export function AuthNav({ signupsEnabled }: AuthNavProps) {
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
        {signupsEnabled ? (
          <Link
            href="/sign-up"
            className="px-2 py-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Sign Up
          </Link>
        ) : null}
      </div>
    );
  }

  const handle =
    ("handle" in session.user && typeof session.user.handle === "string"
      ? session.user.handle
      : null) ||
    session.user.name ||
    "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={isSigningOut}>
          {handle}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-40 rounded-none border border-[var(--border)] bg-[var(--background)] p-1 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
      >
        <DropdownMenuItem asChild className="rounded-none text-[var(--muted-foreground)]">
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-none text-[var(--muted-foreground)]"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          {isSigningOut ? "Signing Out..." : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
