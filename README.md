# Markino

Markino is a local-network movie watch and ranking app built with Astro, React islands, Drizzle, Better Auth, and Postgres.

## Setup

Install dependencies:

```bash
pnpm install
```

Create or start the local Postgres database, then run the existing Drizzle migrations:

```bash
pnpm run db:setup
```

Set the app environment variables in `.env.local`:

```bash
DATABASE_URL=postgres://markino:markino@localhost:54322/markino
BETTER_AUTH_SECRET=replace-with-a-random-32-plus-character-secret
TMDB_ACCESS_TOKEN=replace-with-your-tmdb-read-access-token
```

Start the development server:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local Network Runtime

Run the app and database together:

```bash
docker compose up --build
```

The Astro app is exposed on [http://localhost:3000](http://localhost:3000). Postgres stays on the Compose network for the app and is also bound to `127.0.0.1:54322` for local Drizzle commands.

## Local Database

`pnpm run db:local` creates or starts a Docker-backed Postgres database with Docker Compose.

Defaults:

```bash
DATABASE_URL=postgres://markino:markino@localhost:54322/markino
```

The Compose setup is non-destructive. Data is stored in the persistent Docker volume `markino-postgres-data`, so restarting the container keeps existing data.

To change the local database defaults, update `docker-compose.yml` and keep `.env.local` in sync before running `pnpm run db:local`:

```bash
DATABASE_URL=postgres://markino:markino@localhost:54322/markino
```

Containerized app runtime uses:

```bash
DATABASE_URL=postgres://markino:markino@postgres:5432/markino
```
