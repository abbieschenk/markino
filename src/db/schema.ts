import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: text("id").default(sql`gen_random_uuid()::text`).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_sessions_token_unique").on(table.token),
    index("auth_sessions_user_id_idx").on(table.userId),
  ],
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: text("id").default(sql`gen_random_uuid()::text`).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("auth_accounts_user_id_idx").on(table.userId),
    uniqueIndex("auth_accounts_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

export const authVerifications = pgTable(
  "auth_verifications",
  {
    id: text("id").default(sql`gen_random_uuid()::text`).primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("auth_verifications_identifier_idx").on(table.identifier)],
);

export const watchStatusEnum = pgEnum("watch_status", [
  "watched",
  "dnf",
  "dns",
]);

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
  "superadmin",
]);

export const movieCreditTypeEnum = pgEnum("movie_credit_type", [
  "cast",
  "crew",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    handle: varchar("handle", { length: 32 }).notNull(),
    displayName: varchar("display_name", { length: 128 }).notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_handle_unique").on(table.handle),
    uniqueIndex("users_email_unique").on(table.email),
  ],
);

export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    originalTitle: text("original_title"),
    overview: text("overview"),
    releaseYear: integer("release_year"),
    releaseDate: date("release_date", { mode: "string" }),
    runtimeMinutes: integer("runtime_minutes"),
    originalLanguage: varchar("original_language", { length: 32 }),
    originCountries: jsonb("origin_countries").$type<string[]>(),
    tmdbId: integer("tmdb_id"),
    imdbId: varchar("imdb_id", { length: 32 }),
    posterPath: text("poster_path"),
    tagline: text("tagline"),
    budget: bigint("budget", { mode: "number" }),
    revenue: bigint("revenue", { mode: "number" }),
    director: text("director"),
    writer: text("writer"),
    editor: text("editor"),
    metadataSyncedAt: timestamp("metadata_synced_at", { withTimezone: true }),
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

export const genres = pgTable(
  "genres",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tmdbGenreId: integer("tmdb_genre_id").notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    uniqueIndex("genres_tmdb_genre_id_unique").on(table.tmdbGenreId),
  ],
);

export const movieGenres = pgTable(
  "movie_genres",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("movie_genres_movie_genre_unique").on(
      table.movieId,
      table.genreId,
    ),
    index("movie_genres_genre_id_idx").on(table.genreId),
  ],
);

export const productionCountries = pgTable(
  "production_countries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    isoCode: varchar("iso_code", { length: 8 }).notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    uniqueIndex("production_countries_iso_code_unique").on(table.isoCode),
  ],
);

export const movieProductionCountries = pgTable(
  "movie_production_countries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    countryCode: varchar("country_code", { length: 8 })
      .notNull()
      .references(() => productionCountries.isoCode, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("movie_production_countries_movie_country_unique").on(
      table.movieId,
      table.countryCode,
    ),
    index("movie_production_countries_country_code_idx").on(table.countryCode),
  ],
);

export const spokenLanguages = pgTable(
  "spoken_languages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    isoCode: varchar("iso_code", { length: 16 }).notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    uniqueIndex("spoken_languages_iso_code_unique").on(table.isoCode),
  ],
);

export const movieSpokenLanguages = pgTable(
  "movie_spoken_languages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    languageCode: varchar("language_code", { length: 16 })
      .notNull()
      .references(() => spokenLanguages.isoCode, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("movie_spoken_languages_movie_language_unique").on(
      table.movieId,
      table.languageCode,
    ),
    index("movie_spoken_languages_language_code_idx").on(table.languageCode),
  ],
);

export const studios = pgTable(
  "studios",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tmdbCompanyId: integer("tmdb_company_id").notNull(),
    name: text("name").notNull(),
    originCountry: varchar("origin_country", { length: 8 }),
  },
  (table) => [
    uniqueIndex("studios_tmdb_company_id_unique").on(table.tmdbCompanyId),
  ],
);

export const movieStudios = pgTable(
  "movie_studios",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    studioId: uuid("studio_id")
      .notNull()
      .references(() => studios.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("movie_studios_movie_studio_unique").on(
      table.movieId,
      table.studioId,
    ),
    index("movie_studios_studio_id_idx").on(table.studioId),
  ],
);

export const people = pgTable(
  "people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tmdbPersonId: integer("tmdb_person_id").notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    uniqueIndex("people_tmdb_person_id_unique").on(table.tmdbPersonId),
  ],
);

export const movieCredits = pgTable(
  "movie_credits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    creditType: movieCreditTypeEnum("credit_type").notNull(),
    department: text("department"),
    job: text("job"),
    character: text("character"),
    creditOrder: integer("credit_order"),
  },
  (table) => [
    index("movie_credits_movie_id_idx").on(table.movieId),
    index("movie_credits_person_id_idx").on(table.personId),
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
    id: uuid("id").defaultRandom().primaryKey(),
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
    uniqueIndex("watch_entry_participants_entry_user_unique").on(
      table.watchEntryId,
      table.userId,
    ),
    index("watch_entry_participants_user_id_idx").on(table.userId),
  ],
);

export const userDefaultWatchParticipants = pgTable(
  "user_default_watch_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    participantUserId: uuid("participant_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_default_watch_participants_user_participant_unique").on(
      table.userId,
      table.participantUserId,
    ),
    index("user_default_watch_participants_participant_user_id_idx").on(
      table.participantUserId,
    ),
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
  defaultWatchParticipants: many(userDefaultWatchParticipants, {
    relationName: "defaultWatchParticipantOwner",
  }),
  defaultWatchParticipantFor: many(userDefaultWatchParticipants, {
    relationName: "defaultWatchParticipantUser",
  }),
  movieRankings: many(movieRankings),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  watchEntries: many(watchEntries),
  movieRankings: many(movieRankings),
  genres: many(movieGenres),
  productionCountries: many(movieProductionCountries),
  spokenLanguages: many(movieSpokenLanguages),
  studios: many(movieStudios),
  credits: many(movieCredits),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movies: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const productionCountriesRelations = relations(
  productionCountries,
  ({ many }) => ({
    movies: many(movieProductionCountries),
  }),
);

export const movieProductionCountriesRelations = relations(
  movieProductionCountries,
  ({ one }) => ({
    movie: one(movies, {
      fields: [movieProductionCountries.movieId],
      references: [movies.id],
    }),
    country: one(productionCountries, {
      fields: [movieProductionCountries.countryCode],
      references: [productionCountries.isoCode],
    }),
  }),
);

export const spokenLanguagesRelations = relations(
  spokenLanguages,
  ({ many }) => ({
    movies: many(movieSpokenLanguages),
  }),
);

export const movieSpokenLanguagesRelations = relations(
  movieSpokenLanguages,
  ({ one }) => ({
    movie: one(movies, {
      fields: [movieSpokenLanguages.movieId],
      references: [movies.id],
    }),
    language: one(spokenLanguages, {
      fields: [movieSpokenLanguages.languageCode],
      references: [spokenLanguages.isoCode],
    }),
  }),
);

export const studiosRelations = relations(studios, ({ many }) => ({
  movies: many(movieStudios),
}));

export const movieStudiosRelations = relations(movieStudios, ({ one }) => ({
  movie: one(movies, {
    fields: [movieStudios.movieId],
    references: [movies.id],
  }),
  studio: one(studios, {
    fields: [movieStudios.studioId],
    references: [studios.id],
  }),
}));

export const peopleRelations = relations(people, ({ many }) => ({
  credits: many(movieCredits),
}));

export const movieCreditsRelations = relations(movieCredits, ({ one }) => ({
  movie: one(movies, {
    fields: [movieCredits.movieId],
    references: [movies.id],
  }),
  person: one(people, {
    fields: [movieCredits.personId],
    references: [people.id],
  }),
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

export const userDefaultWatchParticipantsRelations = relations(
  userDefaultWatchParticipants,
  ({ one }) => ({
    user: one(users, {
      fields: [userDefaultWatchParticipants.userId],
      references: [users.id],
      relationName: "defaultWatchParticipantOwner",
    }),
    participantUser: one(users, {
      fields: [userDefaultWatchParticipants.participantUserId],
      references: [users.id],
      relationName: "defaultWatchParticipantUser",
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
