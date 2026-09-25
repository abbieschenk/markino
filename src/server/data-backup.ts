import { asc } from "drizzle-orm";

import { db } from "@/db";
import {
  genres,
  movieCredits,
  movieGenres,
  movieProductionCountries,
  movieRankings,
  movies,
  movieSpokenLanguages,
  movieStudios,
  people,
  productionCountries,
  spokenLanguages,
  studios,
  userDefaultWatchParticipants,
  users,
  watchEntries,
  watchEntryParticipants,
} from "@/db/schema";

export const BACKUP_FORMAT = "markino-backup";
export const BACKUP_SCHEMA_VERSION = 1;

const coreTables = {
  users,
  movies,
  watchEntries,
  watchEntryParticipants,
  userDefaultWatchParticipants,
  movieRankings,
};

const metadataTables = {
  genres,
  movieGenres,
  productionCountries,
  movieProductionCountries,
  spokenLanguages,
  movieSpokenLanguages,
  studios,
  movieStudios,
  people,
  movieCredits,
};

type CollectionName = keyof typeof coreTables | keyof typeof metadataTables;
type BackupRow = Record<string, unknown>;

export type MarkinoBackup = {
  format: typeof BACKUP_FORMAT;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  includesTmdbMetadata: boolean;
  data: Record<CollectionName, BackupRow[]>;
};

export type BackupPreview = {
  exportedAt: string;
  includesTmdbMetadata: boolean;
  counts: Record<CollectionName, number>;
};

type FieldKind = "string" | "nullableString" | "number" | "nullableNumber";
type RowShape = Record<string, FieldKind>;

const timestamp = "string" as const;
const nullableString = "nullableString" as const;
const nullableNumber = "nullableNumber" as const;

const shapes: Record<CollectionName, RowShape> = {
  users: { id: "string", handle: "string", displayName: "string", role: "string", createdAt: timestamp, updatedAt: timestamp },
  movies: { id: "string", title: "string", tmdbId: nullableNumber, createdAt: timestamp, updatedAt: timestamp },
  watchEntries: { id: "string", userId: "string", movieId: "string", watchedOn: "string", watchedDatePrecision: "string", languageWatched: "string", status: "string", notes: nullableString, createdAt: timestamp, updatedAt: timestamp },
  watchEntryParticipants: { id: "string", watchEntryId: "string", userId: "string", createdAt: timestamp },
  userDefaultWatchParticipants: { id: "string", userId: "string", participantUserId: "string", createdAt: timestamp },
  movieRankings: { id: "string", userId: "string", movieId: "string", rank: "number", createdAt: timestamp, updatedAt: timestamp },
  genres: { id: "string", tmdbGenreId: "number", name: "string" },
  movieGenres: { id: "string", movieId: "string", genreId: "string" },
  productionCountries: { id: "string", isoCode: "string", name: "string" },
  movieProductionCountries: { id: "string", movieId: "string", countryCode: "string" },
  spokenLanguages: { id: "string", isoCode: "string", name: "string" },
  movieSpokenLanguages: { id: "string", movieId: "string", languageCode: "string" },
  studios: { id: "string", tmdbCompanyId: "number", name: "string", originCountry: nullableString },
  movieStudios: { id: "string", movieId: "string", studioId: "string" },
  people: { id: "string", tmdbPersonId: "number", name: "string" },
  movieCredits: { id: "string", movieId: "string", personId: "string", creditType: "string", department: nullableString, job: nullableString, character: nullableString, creditOrder: nullableNumber },
};

const enrichedMovieShape: RowShape = {
  originalTitle: nullableString,
  overview: nullableString,
  releaseYear: nullableNumber,
  releaseDate: nullableString,
  runtimeMinutes: nullableNumber,
  originalLanguage: nullableString,
  originCountries: "nullableString", // checked separately as string[] | null
  imdbId: nullableString,
  posterPath: nullableString,
  tagline: nullableString,
  budget: nullableNumber,
  revenue: nullableNumber,
  director: nullableString,
  writer: nullableString,
  editor: nullableString,
  metadataSyncedAt: nullableString,
};

const metadataNames = Object.keys(metadataTables) as (keyof typeof metadataTables)[];
const allNames = Object.keys({ ...coreTables, ...metadataTables }) as CollectionName[];

function serialized<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function createBackup(includeTmdbMetadata: boolean): Promise<MarkinoBackup> {
  const [userRows, movieRows, entryRows, participantRows, defaultRows, rankingRows] = await Promise.all([
    db.select().from(users).orderBy(asc(users.id)),
    db.select().from(movies).orderBy(asc(movies.id)),
    db.select().from(watchEntries).orderBy(asc(watchEntries.id)),
    db.select().from(watchEntryParticipants).orderBy(asc(watchEntryParticipants.id)),
    db.select().from(userDefaultWatchParticipants).orderBy(asc(userDefaultWatchParticipants.id)),
    db.select().from(movieRankings).orderBy(asc(movieRankings.id)),
  ]);

  const leanMovies = movieRows.map(({ id, title, tmdbId, createdAt, updatedAt }) => ({ id, title, tmdbId, createdAt, updatedAt }));
  const data = {
    users: userRows,
    movies: includeTmdbMetadata ? movieRows : leanMovies,
    watchEntries: entryRows,
    watchEntryParticipants: participantRows,
    userDefaultWatchParticipants: defaultRows,
    movieRankings: rankingRows,
    genres: [], movieGenres: [], productionCountries: [], movieProductionCountries: [],
    spokenLanguages: [], movieSpokenLanguages: [], studios: [], movieStudios: [], people: [], movieCredits: [],
  } as unknown as MarkinoBackup["data"];

  if (includeTmdbMetadata) {
    const results = await Promise.all(metadataNames.map((name) => db.select().from(metadataTables[name]).orderBy(asc(metadataTables[name].id))));
    metadataNames.forEach((name, index) => { data[name] = results[index] as unknown as BackupRow[]; });
  }

  return serialized({ format: BACKUP_FORMAT, schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString(), includesTmdbMetadata: includeTmdbMetadata, data });
}

function fail(message: string): never { throw new Error(message); }
function isRecord(value: unknown): value is BackupRow { return typeof value === "object" && value !== null && !Array.isArray(value); }
function validDate(value: unknown) { return typeof value === "string" && !Number.isNaN(Date.parse(value)); }
function validUuid(value: unknown) { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function validCalendarDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

const uuidFields = new Set([
  "id",
  "userId",
  "movieId",
  "watchEntryId",
  "participantUserId",
  "genreId",
  "studioId",
  "personId",
]);
function assertUnique(rows: BackupRow[], key: string, collection: string) {
  const seen = new Set<unknown>();
  for (const row of rows) {
    if (seen.has(row[key])) fail(`${collection} contains a duplicate ${key}.`);
    seen.add(row[key]);
  }
}
function assertPairUnique(rows: BackupRow[], a: string, b: string, collection: string) {
  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${String(row[a])}\0${String(row[b])}`;
    if (seen.has(key)) fail(`${collection} contains a duplicate ${a}/${b} relationship.`);
    seen.add(key);
  }
}
function assertReferences(rows: BackupRow[], key: string, targets: Set<unknown>, collection: string) {
  for (const row of rows) if (!targets.has(row[key])) fail(`${collection} contains a broken ${key} reference.`);
}

export function validateBackup(value: unknown): MarkinoBackup {
  if (!isRecord(value)) fail("Backup must be a JSON object.");
  if (Object.keys(value).sort().join("\0") !== ["data", "exportedAt", "format", "includesTmdbMetadata", "schemaVersion"].sort().join("\0")) fail("Backup contains missing or unknown top-level fields.");
  if (value.format !== BACKUP_FORMAT) fail("This is not a Markino backup.");
  if (value.schemaVersion !== BACKUP_SCHEMA_VERSION) fail(`Unsupported backup schema version: ${String(value.schemaVersion)}.`);
  if (!validDate(value.exportedAt)) fail("Backup export date is invalid.");
  if (typeof value.includesTmdbMetadata !== "boolean") fail("Backup metadata mode is invalid.");
  if (!isRecord(value.data)) fail("Backup data is missing.");

  const data = value.data;
  if (Object.keys(data).sort().join("\0") !== [...allNames].sort().join("\0")) fail("Backup data contains missing or unknown collections.");
  for (const name of allNames) {
    const rows = data[name];
    if (!Array.isArray(rows)) fail(`Backup collection ${name} is missing.`);
    if (!value.includesTmdbMetadata && metadataNames.includes(name as keyof typeof metadataTables) && rows.length > 0) fail(`Lean backup contains unexpected ${name} metadata.`);
    for (const row of rows) {
      if (!isRecord(row)) fail(`${name} contains an invalid record.`);
      const shape = name === "movies" && value.includesTmdbMetadata ? { ...shapes.movies, ...enrichedMovieShape } : shapes[name];
      const expected = Object.keys(shape).sort();
      const actual = Object.keys(row).sort();
      if (expected.join("\0") !== actual.join("\0")) fail(`${name} contains a record with missing or unknown fields.`);
      for (const [field, kind] of Object.entries(shape)) {
        const fieldValue = row[field];
        if (name === "movies" && field === "originCountries") {
          if (fieldValue !== null && (!Array.isArray(fieldValue) || !fieldValue.every((item) => typeof item === "string"))) fail("movies.originCountries has an invalid value.");
          continue;
        }
        const valid = kind === "string" ? typeof fieldValue === "string" : kind === "number" ? typeof fieldValue === "number" && Number.isFinite(fieldValue) : kind === "nullableString" ? fieldValue === null || typeof fieldValue === "string" : fieldValue === null || (typeof fieldValue === "number" && Number.isFinite(fieldValue));
        if (!valid) fail(`${name}.${field} has an invalid value.`);
      }
    }
    assertUnique(rows, "id", name);
  }

  const typed = value as unknown as MarkinoBackup;
  const d = typed.data;

  for (const name of allNames) {
    for (const row of d[name]) {
      for (const [field, fieldValue] of Object.entries(row)) {
        if (uuidFields.has(field) && !validUuid(fieldValue)) fail(`${name}.${field} must be a UUID.`);
      }
    }
  }
  const userIds = new Set(d.users.map((row) => row.id));
  const movieIds = new Set(d.movies.map((row) => row.id));
  const entryIds = new Set(d.watchEntries.map((row) => row.id));
  const genreIds = new Set(d.genres.map((row) => row.id));
  const countryCodes = new Set(d.productionCountries.map((row) => row.isoCode));
  const languageCodes = new Set(d.spokenLanguages.map((row) => row.isoCode));
  const studioIds = new Set(d.studios.map((row) => row.id));
  const peopleIds = new Set(d.people.map((row) => row.id));

  if (!d.users.some((row) => row.role === "superadmin")) fail("Backup must contain at least one superadmin profile.");
  for (const row of d.users) if (!["user", "admin", "superadmin"].includes(String(row.role))) fail("users contains an invalid role.");
  for (const row of d.watchEntries) {
    if (!["watched", "dnf", "dns"].includes(String(row.status))) fail("watchEntries contains an invalid status.");
    if (!["day", "year"].includes(String(row.watchedDatePrecision))) fail("watchEntries contains an invalid date precision.");
    if (row.watchedDatePrecision === "day" ? !validCalendarDate(row.watchedOn) : !/^\d{4}$/.test(String(row.watchedOn))) fail("watchEntries contains an invalid watched date.");
  }
  for (const row of d.movieCredits) if (!["cast", "crew"].includes(String(row.creditType))) fail("movieCredits contains an invalid credit type.");
  for (const name of ["users", "movies", "watchEntries", "watchEntryParticipants", "userDefaultWatchParticipants", "movieRankings"] as const) {
    for (const row of d[name]) for (const field of Object.keys(row).filter((key) => key.endsWith("At"))) if (row[field] !== null && !validDate(row[field])) fail(`${name}.${field} contains an invalid timestamp.`);
  }
  for (const row of d.movies) {
    if (row.releaseDate !== undefined && row.releaseDate !== null && !validCalendarDate(row.releaseDate)) fail("movies.releaseDate contains an invalid date.");
    if (row.metadataSyncedAt !== undefined && row.metadataSyncedAt !== null && !validDate(row.metadataSyncedAt)) fail("movies.metadataSyncedAt contains an invalid timestamp.");
  }
  assertUnique(d.users, "handle", "users"); assertUnique(d.movies.filter((row) => row.tmdbId !== null), "tmdbId", "movies");
  assertReferences(d.watchEntries, "userId", userIds, "watchEntries"); assertReferences(d.watchEntries, "movieId", movieIds, "watchEntries");
  assertReferences(d.watchEntryParticipants, "watchEntryId", entryIds, "watchEntryParticipants"); assertReferences(d.watchEntryParticipants, "userId", userIds, "watchEntryParticipants");
  assertReferences(d.userDefaultWatchParticipants, "userId", userIds, "userDefaultWatchParticipants"); assertReferences(d.userDefaultWatchParticipants, "participantUserId", userIds, "userDefaultWatchParticipants");
  assertReferences(d.movieRankings, "userId", userIds, "movieRankings"); assertReferences(d.movieRankings, "movieId", movieIds, "movieRankings");
  assertPairUnique(d.watchEntryParticipants, "watchEntryId", "userId", "watchEntryParticipants"); assertPairUnique(d.userDefaultWatchParticipants, "userId", "participantUserId", "userDefaultWatchParticipants"); assertPairUnique(d.movieRankings, "userId", "movieId", "movieRankings"); assertPairUnique(d.movieRankings, "userId", "rank", "movieRankings");
  assertReferences(d.movieGenres, "movieId", movieIds, "movieGenres"); assertReferences(d.movieGenres, "genreId", genreIds, "movieGenres");
  assertReferences(d.movieProductionCountries, "movieId", movieIds, "movieProductionCountries"); assertReferences(d.movieProductionCountries, "countryCode", countryCodes, "movieProductionCountries");
  assertReferences(d.movieSpokenLanguages, "movieId", movieIds, "movieSpokenLanguages"); assertReferences(d.movieSpokenLanguages, "languageCode", languageCodes, "movieSpokenLanguages");
  assertReferences(d.movieStudios, "movieId", movieIds, "movieStudios"); assertReferences(d.movieStudios, "studioId", studioIds, "movieStudios");
  assertReferences(d.movieCredits, "movieId", movieIds, "movieCredits"); assertReferences(d.movieCredits, "personId", peopleIds, "movieCredits");
  assertPairUnique(d.movieGenres, "movieId", "genreId", "movieGenres"); assertPairUnique(d.movieProductionCountries, "movieId", "countryCode", "movieProductionCountries"); assertPairUnique(d.movieSpokenLanguages, "movieId", "languageCode", "movieSpokenLanguages"); assertPairUnique(d.movieStudios, "movieId", "studioId", "movieStudios");
  assertUnique(d.genres, "tmdbGenreId", "genres"); assertUnique(d.productionCountries, "isoCode", "productionCountries"); assertUnique(d.spokenLanguages, "isoCode", "spokenLanguages"); assertUnique(d.studios, "tmdbCompanyId", "studios"); assertUnique(d.people, "tmdbPersonId", "people");

  const ranks = new Map<unknown, number[]>();
  for (const row of d.movieRankings) { if (!Number.isInteger(row.rank) || Number(row.rank) < 1) fail("movieRankings contains an invalid rank."); const values = ranks.get(row.userId) ?? []; values.push(Number(row.rank)); ranks.set(row.userId, values); }
  for (const values of ranks.values()) { values.sort((a, b) => a - b); if (values.some((rank, index) => rank !== index + 1)) fail("Each profile's rankings must be contiguous from 1."); }
  return typed;
}

export function previewBackup(backup: MarkinoBackup): BackupPreview {
  return { exportedAt: backup.exportedAt, includesTmdbMetadata: backup.includesTmdbMetadata, counts: Object.fromEntries(allNames.map((name) => [name, backup.data[name].length])) as BackupPreview["counts"] };
}

function forInsert(rows: BackupRow[]) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, key.endsWith("At") && value !== null ? new Date(String(value)) : value])));
}

export async function restoreBackup(backup: MarkinoBackup) {
  await db.transaction(async (tx) => {
    await tx.delete(movieCredits); await tx.delete(movieStudios); await tx.delete(movieSpokenLanguages); await tx.delete(movieProductionCountries); await tx.delete(movieGenres);
    await tx.delete(movieRankings); await tx.delete(userDefaultWatchParticipants); await tx.delete(watchEntryParticipants); await tx.delete(watchEntries);
    await tx.delete(people); await tx.delete(studios); await tx.delete(spokenLanguages); await tx.delete(productionCountries); await tx.delete(genres); await tx.delete(movies); await tx.delete(users);
    const insert = async (table: typeof users, rows: BackupRow[]) => {
      const batchSize = 100;

      for (let offset = 0; offset < rows.length; offset += batchSize) {
        await tx
          .insert(table)
          .values(forInsert(rows.slice(offset, offset + batchSize)) as never);
      }
    };
    await insert(users, backup.data.users); await insert(movies as never, backup.data.movies); await insert(genres as never, backup.data.genres); await insert(productionCountries as never, backup.data.productionCountries); await insert(spokenLanguages as never, backup.data.spokenLanguages); await insert(studios as never, backup.data.studios); await insert(people as never, backup.data.people);
    await insert(watchEntries as never, backup.data.watchEntries); await insert(watchEntryParticipants as never, backup.data.watchEntryParticipants); await insert(userDefaultWatchParticipants as never, backup.data.userDefaultWatchParticipants); await insert(movieRankings as never, backup.data.movieRankings);
    await insert(movieGenres as never, backup.data.movieGenres); await insert(movieProductionCountries as never, backup.data.movieProductionCountries); await insert(movieSpokenLanguages as never, backup.data.movieSpokenLanguages); await insert(movieStudios as never, backup.data.movieStudios); await insert(movieCredits as never, backup.data.movieCredits);
  });
}
