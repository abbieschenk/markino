import { defineAction } from "astro:actions";
import { z } from "astro:schema";

import {
  addMovieEntry,
  deleteMovieEntry,
  reorderMovieRankings,
  resyncMovieMetadata,
  searchTmdbMovieMatches,
  searchTmdbMovieMatchesByTitle,
  syncMovieMetadata,
  updateMovieEntry,
} from "@/server/movie-actions";
import { updateDefaultWatchedWith } from "@/server/settings-actions";

export const server = {
  addMovieEntry: defineAction({
    accept: "form",
    handler: (formData, context) =>
      addMovieEntry(formData, context.request.headers),
  }),
  deleteMovieEntry: defineAction({
    input: z.object({
      watchEntryId: z.string(),
    }),
    handler: ({ watchEntryId }, context) =>
      deleteMovieEntry(watchEntryId, context.request.headers),
  }),
  updateMovieEntry: defineAction({
    input: z.object({
      watchEntryId: z.string(),
      watchedOn: z.string(),
      watchedDatePrecision: z.enum(["day", "year"]),
      languageWatched: z.string(),
      watchedWithHandles: z.array(z.string()),
    }),
    handler: (input, context) => updateMovieEntry(input, context.request.headers),
  }),
  reorderMovieRankings: defineAction({
    input: z.object({
      movieIds: z.array(z.string()),
    }),
    handler: ({ movieIds }, context) =>
      reorderMovieRankings(movieIds, context.request.headers),
  }),
  searchTmdbMovieMatches: defineAction({
    input: z.object({
      movieId: z.string(),
    }),
    handler: ({ movieId }, context) =>
      searchTmdbMovieMatches(movieId, context.request.headers),
  }),
  searchTmdbMovieMatchesByTitle: defineAction({
    input: z.object({
      title: z.string(),
    }),
    handler: ({ title }, context) =>
      searchTmdbMovieMatchesByTitle(title, context.request.headers),
  }),
  syncMovieMetadata: defineAction({
    input: z.object({
      movieId: z.string(),
      tmdbId: z.number().int().positive(),
    }),
    handler: ({ movieId, tmdbId }, context) =>
      syncMovieMetadata(movieId, tmdbId, context.request.headers),
  }),
  resyncMovieMetadata: defineAction({
    input: z.object({
      movieId: z.string(),
    }),
    handler: ({ movieId }, context) =>
      resyncMovieMetadata(movieId, context.request.headers),
  }),
  updateDefaultWatchedWith: defineAction({
    accept: "form",
    handler: (formData, context) =>
      updateDefaultWatchedWith(formData, context.request.headers),
  }),
};
