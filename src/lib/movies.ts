export type WatchStatus = "watched" | "dnf" | "dns";

export type MovieLedgerEntry = {
  id: string;
  rank: number;
  title: string;
  watchedOn: string;
  language: string;
  status: WatchStatus;
  watchedWith: string[];
};

export const movieLedger: MovieLedgerEntry[] = [
  {
    id: "tokyo-story",
    rank: 1,
    title: "Tokyo Story",
    watchedOn: "2026-04-19",
    language: "Japanese",
    status: "watched",
    watchedWith: ["Ari"],
  },
  {
    id: "la-ceremonie",
    rank: 2,
    title: "La Ceremonie",
    watchedOn: "2026-03-03",
    language: "French",
    status: "watched",
    watchedWith: [],
  },
  {
    id: "the-green-ray",
    rank: 3,
    title: "The Green Ray",
    watchedOn: "2026-02-14",
    language: "French",
    status: "watched",
    watchedWith: ["Noa"],
  },
  {
    id: "cure",
    rank: 4,
    title: "Cure",
    watchedOn: "2026-01-09",
    language: "Japanese",
    status: "watched",
    watchedWith: ["Ari", "Noa"],
  },
  {
    id: "news-from-home",
    rank: 5,
    title: "News from Home",
    watchedOn: "2025-12-22",
    language: "French",
    status: "dnf",
    watchedWith: [],
  },
  {
    id: "in-the-mood-for-love",
    rank: 6,
    title: "In the Mood for Love",
    watchedOn: "2025-11-30",
    language: "Cantonese",
    status: "watched",
    watchedWith: ["Mina"],
  },
  {
    id: "where-is-the-friends-house",
    rank: 7,
    title: "Where Is the Friend's House?",
    watchedOn: "2025-11-02",
    language: "Persian",
    status: "watched",
    watchedWith: [],
  },
  {
    id: "red-desert",
    rank: 8,
    title: "Red Desert",
    watchedOn: "2025-10-10",
    language: "Italian",
    status: "dns",
    watchedWith: ["Mina"],
  },
];

export function getMovieById(id: string) {
  return movieLedger.find((movie) => movie.id === id);
}
