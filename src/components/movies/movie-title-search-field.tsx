"use client";

import { X } from "@phosphor-icons/react";
import { actions } from "astro:actions";
import { startTransition, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getActionData } from "@/lib/action-result";
import type { TmdbMovieMatch } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

type TmdbMatch = TmdbMovieMatch;

type MovieTitleSearchFieldProps = {
  id: string;
  titleName: string;
  tmdbIdName: string;
  userId: string;
  portalContainer?: HTMLElement | null;
  required?: boolean;
  ariaLabel: string;
};

const SEARCH_DEBOUNCE_MS = 450;
const MIN_SEARCH_LENGTH = 2;
const PANEL_MAX_HEIGHT = 288;
const PANEL_MIN_HEIGHT = 56;
const PANEL_GAP = 4;

export function MovieTitleSearchField({
  id,
  titleName,
  tmdbIdName,
  userId,
  portalContainer,
  required = false,
  ariaLabel,
}: MovieTitleSearchFieldProps) {
  const requestIdRef = useRef(0);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [matches, setMatches] = useState<TmdbMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<TmdbMatch | null>(null);
  const [pending, setPending] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    const query = title.trim();

    if (selectedMatch && query === selectedMatch.title) {
      return;
    }

    if (query.length < MIN_SEARCH_LENGTH) {
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    const timeoutId = window.setTimeout(() => {
      setPending(true);
      startTransition(async () => {
        try {
          const result = await getActionData(
            actions.searchTmdbMovieMatchesByTitle({ title: query, userId }),
          );

          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          if (result.status === "error") {
            setMatches([]);
            setError(result.message);
            return;
          }

          setMatches(result.matches);
        } catch (searchError) {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          console.error("Failed to search TMDB", searchError);
          setMatches([]);
          setError("Unable to search TMDB.");
        } finally {
          if (requestIdRef.current === currentRequestId) {
            setPending(false);
          }
        }
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [selectedMatch, title, userId]);

  useEffect(() => {
    if (!focused) {
      return;
    }

    function updatePanelStyle() {
      const fieldElement = fieldRef.current;

      if (!fieldElement) {
        return;
      }

      const rect = fieldElement.getBoundingClientRect();

      if (portalContainer) {
        const containerRect = portalContainer.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - PANEL_GAP;
        const spaceAbove = rect.top - PANEL_GAP;
        const shouldOpenAbove =
          spaceBelow < PANEL_MIN_HEIGHT && spaceAbove > spaceBelow;
        const availableSpace = shouldOpenAbove ? spaceAbove : spaceBelow;
        const maxHeight = Math.min(
          PANEL_MAX_HEIGHT,
          Math.max(PANEL_MIN_HEIGHT, Math.floor(availableSpace)),
        );

        setPanelStyle({
          bottom: shouldOpenAbove
            ? containerRect.bottom - rect.top + PANEL_GAP
            : undefined,
          left: rect.left - containerRect.left,
          maxHeight,
          top: shouldOpenAbove
            ? undefined
            : rect.bottom - containerRect.top + PANEL_GAP,
          width: rect.width,
        });
        return;
      }

      setPanelStyle({
        left: rect.left,
        maxHeight: PANEL_MAX_HEIGHT,
        top: rect.bottom + PANEL_GAP,
        width: rect.width,
      });
    }

    window.addEventListener("resize", updatePanelStyle);
    window.addEventListener("scroll", updatePanelStyle, true);

    return () => {
      window.removeEventListener("resize", updatePanelStyle);
      window.removeEventListener("scroll", updatePanelStyle, true);
    };
  }, [focused, portalContainer]);

  function handleTitleChange(nextTitle: string) {
    requestIdRef.current += 1;
    setTitle(nextTitle);
    setMatches([]);
    setPending(false);
    setError(null);

    if (selectedMatch && nextTitle !== selectedMatch.title) {
      setSelectedMatch(null);
    }
  }

  function selectMatch(match: TmdbMatch) {
    requestIdRef.current += 1;
    setTitle(match.title);
    setSelectedMatch(match);
    setMatches([]);
    setPending(false);
    setError(null);
  }

  function clearSelection() {
    requestIdRef.current += 1;
    setSelectedMatch(null);
    setMatches([]);
    setPending(false);
  }

  const showPanel =
    focused && (pending || error || matches.length > 0) && !selectedMatch;
  const panelElement = showPanel ? (
    <div
      data-slot="movie-title-search-content"
      className={cn(
        "z-[70] overflow-y-auto border border-[var(--border)] bg-[var(--background)] shadow-[0_12px_32px_rgba(0,0,0,0.16)]",
        portalContainer ? "pointer-events-auto absolute" : "fixed",
      )}
      style={panelStyle ?? undefined}
    >
      {pending ? (
        <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
          Searching TMDB
        </div>
      ) : null}
      {error ? (
        <div className="px-3 py-2 text-xs text-[var(--destructive)]">
          {error}
        </div>
      ) : null}
      {!pending && !error && matches.length > 0
        ? matches.map((match) => (
            <button
              key={match.tmdbId}
              type="button"
              className="grid w-full gap-0.5 border-b border-[var(--border)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--muted)]"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectMatch(match)}
            >
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="truncate text-sm font-medium">
                  {match.title}
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {match.releaseYear ?? "Unknown"} /{" "}
                  {match.originalLanguage || "n/a"}
                </span>
              </span>
              {match.originalTitle !== match.title ? (
                <span className="truncate text-[11px] text-[var(--muted-foreground)]">
                  {match.originalTitle}
                </span>
              ) : null}
            </button>
          ))
        : null}
      {!pending && !error && matches.length === 0 ? (
        <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
          No TMDB matches
        </div>
      ) : null}
    </div>
  ) : null;
  const fallbackPortalContainer =
    typeof document !== "undefined" ? document.body : null;
  const activePortalContainer = portalContainer ?? fallbackPortalContainer;
  const panelPortal =
    panelElement && activePortalContainer
      ? createPortal(panelElement, activePortalContainer)
      : null;

  return (
    <div ref={fieldRef} className="relative min-w-0">
      <input
        type="hidden"
        name={tmdbIdName}
        value={selectedMatch?.tmdbId ?? ""}
      />
      <Input
        id={id}
        name={titleName}
        value={title}
        required={required}
        aria-label={ariaLabel}
        autoComplete="off"
        className={cn(selectedMatch && "pr-9")}
        onChange={(event) => handleTitleChange(event.target.value)}
        onFocus={() => {
          const rect = fieldRef.current?.getBoundingClientRect();

          if (rect) {
            if (portalContainer) {
              const containerRect = portalContainer.getBoundingClientRect();
              const spaceBelow = window.innerHeight - rect.bottom - PANEL_GAP;
              const spaceAbove = rect.top - PANEL_GAP;
              const shouldOpenAbove =
                spaceBelow < PANEL_MIN_HEIGHT && spaceAbove > spaceBelow;
              const availableSpace = shouldOpenAbove ? spaceAbove : spaceBelow;
              const maxHeight = Math.min(
                PANEL_MAX_HEIGHT,
                Math.max(PANEL_MIN_HEIGHT, Math.floor(availableSpace)),
              );

              setPanelStyle({
                bottom: shouldOpenAbove
                  ? containerRect.bottom - rect.top + PANEL_GAP
                  : undefined,
                left: rect.left - containerRect.left,
                maxHeight,
                top: shouldOpenAbove
                  ? undefined
                  : rect.bottom - containerRect.top + PANEL_GAP,
                width: rect.width,
              });
            } else {
              setPanelStyle({
                left: rect.left,
                maxHeight: PANEL_MAX_HEIGHT,
                top: rect.bottom + PANEL_GAP,
                width: rect.width,
              });
            }
          }

          setFocused(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setFocused(false), 120);
        }}
      />
      {selectedMatch ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1 h-7 w-7 rounded-none text-[var(--muted-foreground)] hover:bg-transparent hover:text-[var(--foreground)]"
          aria-label="Clear TMDB match"
          title="Clear TMDB match"
          onClick={clearSelection}
        >
          <X className="size-3.5" weight="regular" />
        </Button>
      ) : null}
      {panelPortal}
      {selectedMatch ? (
        <div className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          TMDB {selectedMatch.tmdbId}
          {selectedMatch.releaseYear ? ` / ${selectedMatch.releaseYear}` : ""}
        </div>
      ) : null}
    </div>
  );
}
