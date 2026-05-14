import Link from "next/link";

const links = [
  { href: "/", label: "Overview" },
  { href: "/movies", label: "Movies" },
  { href: "/settings", label: "Settings" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--background)_92%,white)] backdrop-blur">
      <div className="flex min-h-14 items-center justify-between gap-4">
        <Link href="/" className="text-sm font-medium tracking-[-0.02em]">
          Markino
        </Link>
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
      </div>
    </header>
  );
}
