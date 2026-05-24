import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-medium tracking-[-0.03em]">Settings</h1>
        <p className="max-w-2xl text-sm text-[var(--muted-foreground)]">
          There are no settings yet
        </p>
      </header>
    </section>
  );
}
