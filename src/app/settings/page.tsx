import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

const settingGroups = [
  {
    title: "Display",
    description: "Density, default sort mode, visible columns.",
  },
  {
    title: "Collaboration",
    description: "Shared ledgers, watched-with defaults, tagging rules.",
  },
  {
    title: "Account",
    description: "Authentication and profile settings will live here later.",
  },
];

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          Settings
        </p>
        <h1 className="text-2xl font-medium tracking-[-0.03em]">Settings</h1>
        <p className="max-w-2xl text-sm text-[var(--muted-foreground)]">
          Placeholder sections only. Authentication and persistence are not
          wired yet.
        </p>
      </header>
      <div className="grid gap-4">
        {settingGroups.map((group) => (
          <section
            key={group.title}
            className="border border-[var(--border)] px-4 py-4"
          >
            <h2 className="text-sm font-medium">{group.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {group.description}
            </p>
          </section>
        ))}
      </div>
    </section>
  );
}
