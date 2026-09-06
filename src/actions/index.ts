import { defineAction } from "astro:actions";
import { z } from "astro:schema";

import { createLocalProfile } from "@/lib/local-profiles";
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
    handler: (formData) => addMovieEntry(formData),
  }),
  deleteMovieEntry: defineAction({
    input: z.object({
      userId: z.string(),
      watchEntryId: z.string(),
    }),
    handler: ({ userId, watchEntryId }) => deleteMovieEntry(userId, watchEntryId),
  }),
  updateMovieEntry: defineAction({
    input: z.object({
      userId: z.string(),
      watchEntryId: z.string(),
      watchedOn: z.string(),
      watchedDatePrecision: z.enum(["day", "year"]),
      languageWatched: z.string(),
      watchedWithHandles: z.array(z.string()),
    }),
    handler: (input) => updateMovieEntry(input),
  }),
  reorderMovieRankings: defineAction({
    input: z.object({
      userId: z.string(),
      movieIds: z.array(z.string()),
    }),
    handler: ({ userId, movieIds }) => reorderMovieRankings(userId, movieIds),
  }),
  searchTmdbMovieMatches: defineAction({
    input: z.object({
      userId: z.string(),
      movieId: z.string(),
    }),
    handler: ({ userId, movieId }) => searchTmdbMovieMatches(userId, movieId),
  }),
  searchTmdbMovieMatchesByTitle: defineAction({
    input: z.object({
      userId: z.string(),
      title: z.string(),
    }),
    handler: ({ userId, title }) => searchTmdbMovieMatchesByTitle(userId, title),
  }),
  syncMovieMetadata: defineAction({
    input: z.object({
      userId: z.string(),
      movieId: z.string(),
      tmdbId: z.number().int().positive(),
    }),
    handler: ({ userId, movieId, tmdbId }) =>
      syncMovieMetadata(userId, movieId, tmdbId),
  }),
  resyncMovieMetadata: defineAction({
    input: z.object({
      userId: z.string(),
      movieId: z.string(),
    }),
    handler: ({ userId, movieId }) => resyncMovieMetadata(userId, movieId),
  }),
  updateDefaultWatchedWith: defineAction({
    accept: "form",
    handler: (formData) => updateDefaultWatchedWith(formData),
  }),
  createLocalProfile: defineAction({
    input: z.object({
      handle: z.string(),
      displayName: z.string(),
    }),
    handler: (input) => createLocalProfile(input),
  }),
};
