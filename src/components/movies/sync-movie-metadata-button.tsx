"use client";

import { ArrowsClockwise } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import {
  searchTmdbMovieMatches,
  syncMovieMetadata,
} from "@/app/movies/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type TmdbMatch = Awaited<
  ReturnType<typeof searchTmdbMovieMatches>
>["matches"][number];

type SyncMovieMetadataButtonProps = {
  movieId: string;
  title: string;
  display?: "label" | "icon";
};

export function SyncMovieMetadataButton({
  movieId,
  title,
  display = "label",
}: SyncMovieMetadataButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<TmdbMatch[]>([]);
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);
  const [searchPending, setSearchPending] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function searchMatches() {
    setSearchPending(true);
    setError(null);
    setMatches([]);
    setSelectedTmdbId(null);

    startTransition(async () => {
      try {
        const result = await searchTmdbMovieMatches(movieId);

        if (result.status === "error") {
          setError(result.message);
          return;
        }

        setMatches(result.matches);
        setSelectedTmdbId(result.matches[0]?.tmdbId ?? null);
      } catch (searchError) {
        console.error("Failed to search TMDB", searchError);
        setError("Unable to search TMDB.");
      } finally {
        setSearchPending(false);
      }
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      searchMatches();
    }
  }

  function handleSync() {
    if (!selectedTmdbId) {
      setError("Select a TMDB match first.");
      return;
    }

    setSyncPending(true);
    setError(null);

    startTransition(async () => {
      try {
        const result = await syncMovieMetadata(movieId, selectedTmdbId);

        if (result.status === "error") {
          setError(result.message ?? "Unable to sync movie metadata.");
          return;
        }

        setOpen(false);
        router.refresh();
      } catch (syncError) {
        console.error("Failed to sync movie metadata", syncError);
        setError("Unable to sync movie metadata.");
      } finally {
        setSyncPending(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={display === "icon" ? "icon-sm" : "sm"}
          className={
            display === "icon"
              ? "text-[var(--muted-foreground)] hover:bg-transparent hover:text-[var(--foreground)]"
              : "rounded-none border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          }
          aria-label={`Sync TMDB metadata for ${title}`}
          title={`Sync TMDB metadata for ${title}`}
        >
          <ArrowsClockwise aria-hidden="true" size={14} weight="regular" />
          {display === "label" ? "Sync TMDB" : null}
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl rounded-none border border-[var(--border)] bg-[var(--background)] p-0 text-[var(--foreground)] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
      >
        <DialogHeader className="border-b border-[var(--border)] px-4 py-3">
          <DialogTitle className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Sync TMDB
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 px-4 py-4 text-sm">
          <div className="font-medium">{title}</div>
          {searchPending ? (
            <div className="border border-[var(--border)] px-3 py-4 text-[var(--muted-foreground)]">
              Searching TMDB
            </div>
          ) : null}
          {!searchPending && matches.length === 0 && !error ? (
            <div className="border border-[var(--border)] px-3 py-4 text-[var(--muted-foreground)]">
              No TMDB matches found.
            </div>
          ) : null}
          {matches.length > 0 ? (
            <div className="max-h-[22rem] overflow-y-auto border border-[var(--border)]">
              {matches.map((match) => (
                <button
                  key={match.tmdbId}
                  type="button"
                  className={cn(
                    "grid w-full gap-1 border-b border-[var(--border)] px-3 py-3 text-left last:border-b-0 hover:bg-[var(--muted)]",
                    selectedTmdbId === match.tmdbId && "bg-[var(--muted)]",
                  )}
                  onClick={() => setSelectedTmdbId(match.tmdbId)}
                >
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-medium">{match.title}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {match.releaseYear ?? "Unknown year"} /{" "}
                      {match.originalLanguage || "n/a"}
                    </span>
                  </span>
                  {match.originalTitle !== match.title ? (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {match.originalTitle}
                    </span>
                  ) : null}
                  <span className="line-clamp-2 text-xs leading-5 text-[var(--muted-foreground)]">
                    {match.overview || "No overview available."}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {error ? (
            <p className="border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 px-3 py-2 text-sm text-[var(--destructive)]">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter className="justify-end rounded-none border-t border-[var(--border)] bg-transparent px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={syncPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSync}
            disabled={searchPending || syncPending || !selectedTmdbId}
          >
            {syncPending ? "Syncing..." : "Confirm Sync"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
