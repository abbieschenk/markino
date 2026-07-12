import { headers } from "next/headers";
import Link from "next/link";

import { AuthNav } from "@/components/auth/AuthNav";
import { auth } from "@/lib/auth";
import { areSignupsEnabled } from "@/lib/auth-config";

const loggedOutLinks = [
  { href: "/", label: "Overview" },
] as const;

const loggedInLinks = [
  { href: "/movies", label: "Movies" },
  { href: "/charts", label: "Charts" },
] as const;

export async function SiteNav() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const signupsEnabled = areSignupsEnabled();
  const links = session ? loggedInLinks : loggedOutLinks;

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--background)_92%,white)] backdrop-blur">
      <div className="flex min-h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="select-none text-xl font-bold uppercase [font-family:Futura,'Futura_PT','Trebuchet_MS',sans-serif]"
        >
          MARKINO
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <nav className="flex flex-wrap items-center gap-1 text-sm text-[var(--muted-foreground)]">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2 py-1 hover:text-[var(--foreground)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <AuthNav signupsEnabled={signupsEnabled} />
        </div>
      </div>
    </header>
  );
}
