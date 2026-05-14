"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

export function AuthNav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setOpen(false);

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

  const handle =
    ("handle" in session.user && typeof session.user.handle === "string"
      ? session.user.handle
      : null) ||
    session.user.name ||
    "Account";

  return (
    <div ref={menuRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isSigningOut}
        onClick={() => setOpen((current) => !current)}
      >
        {handle}
      </Button>
      {open ? (
        <div className="absolute top-full right-0 z-20 mt-2 min-w-40 border border-[var(--border)] bg-[var(--background)] py-1 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
          <Link
            href="/settings"
            className="block px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            disabled={isSigningOut}
            onClick={handleSignOut}
          >
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
