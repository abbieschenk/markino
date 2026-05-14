import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const watchStatusEnum = pgEnum("watch_status", [
  "watched",
  "dnf",
  "dns",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    handle: varchar("handle", { length: 32 }).notNull(),
    displayName: varchar("display_name", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_handle_unique").on(table.handle)],
);

export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    releaseYear: integer("release_year"),
    originalLanguage: varchar("original_language", { length: 32 }),
    tmdbId: integer("tmdb_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("movies_tmdb_id_unique").on(table.tmdbId),
    index("movies_title_idx").on(table.title),
  ],
);

export const watchEntries = pgTable(
  "watch_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    watchedOn: date("watched_on", { mode: "string" }).notNull(),
    languageWatched: varchar("language_watched", { length: 32 }).notNull(),
    status: watchStatusEnum("status").default("watched").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("watch_entries_user_id_idx").on(table.userId),
    index("watch_entries_movie_id_idx").on(table.movieId),
    index("watch_entries_watched_on_idx").on(table.watchedOn),
  ],
);

export const watchEntryParticipants = pgTable(
  "watch_entry_participants",
  {
    watchEntryId: uuid("watch_entry_id")
      .notNull()
      .references(() => watchEntries.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.watchEntryId, table.userId],
      name: "watch_entry_participants_pk",
    }),
    index("watch_entry_participants_user_id_idx").on(table.userId),
  ],
);

export const movieRankings = pgTable(
  "movie_rankings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("movie_rankings_user_movie_unique").on(
      table.userId,
      table.movieId,
    ),
    uniqueIndex("movie_rankings_user_rank_unique").on(table.userId, table.rank),
    index("movie_rankings_movie_id_idx").on(table.movieId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  watchEntries: many(watchEntries),
  watchEntryParticipants: many(watchEntryParticipants),
  movieRankings: many(movieRankings),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  watchEntries: many(watchEntries),
  movieRankings: many(movieRankings),
}));

export const watchEntriesRelations = relations(watchEntries, ({ one, many }) => ({
  user: one(users, {
    fields: [watchEntries.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [watchEntries.movieId],
    references: [movies.id],
  }),
  participants: many(watchEntryParticipants),
}));

export const watchEntryParticipantsRelations = relations(
  watchEntryParticipants,
  ({ one }) => ({
    watchEntry: one(watchEntries, {
      fields: [watchEntryParticipants.watchEntryId],
      references: [watchEntries.id],
    }),
    user: one(users, {
      fields: [watchEntryParticipants.userId],
      references: [users.id],
    }),
  }),
);

export const movieRankingsRelations = relations(movieRankings, ({ one }) => ({
  user: one(users, {
    fields: [movieRankings.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [movieRankings.movieId],
    references: [movies.id],
  }),
}));
