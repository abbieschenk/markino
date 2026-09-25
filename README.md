# Markino

Markino (i.e. Marquee + Kino) is a local-network watched movie app.

Some features:
- Fully locally hostable
- TMDB integration to pull in movie data
- Profiles so you can track who you watched a movie with
- Language the movie was watched in
- Multiple watches per movie
- Fun charts and graphs
- Overall movie ranking — which movie will you rank #1? #2? Last? Does The Cabinet of Dr. Caligari rank higher or lower than Chinatown? The decision (and the dilemma) is yours!
- Import / Export of the data (but be warned this hasn't been tested much)

I built this because I was disatisfied with all the websites / apps that do something similar, and I wanted to be able to build graphs and stuff with my own data — which by building this locally, I fully own.

Markino is built with Astro, Svelte islands, Drizzle, local profiles, and Postgres. It is almost 100% coded with Codex, and there absolutely might be bugs.

Screenshots at the bottom of the README.

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
TMDB_ACCESS_TOKEN=replace-with-your-tmdb-read-access-token
```

Start the development server:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local Network Runtime

Docker Compose reads `TMDB_ACCESS_TOKEN` from the shell or a root-level `.env` file. If you use `.env.local` for development, either copy the token into `.env` or export it before starting Compose:

```bash
export TMDB_ACCESS_TOKEN=your-tmdb-read-access-token
```

Run the app and database together:

```bash
docker compose up --build
```

The Astro app is exposed on [http://localhost:3000](http://localhost:3000). Postgres stays on the Compose network for the app and is also bound to `127.0.0.1:54322` for local Drizzle commands. Compose waits for Postgres, runs all pending Drizzle migrations, and starts the app only after the migrations succeed.

If port `3000` is already in use, set `PORT` to expose the app on a different host port:

```bash
PORT=3001 docker compose up --build
```

The app will then be available at [http://localhost:3001](http://localhost:3001). The container continues to use port `3000` internally.

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

## Screenshots

Note these may be slightly out of date.

Filterable table
![](/screenshots/table.png)

Charts
![](/screenshots/charts-1.png)

![](/screenshots/charts-2.png)

Charts are interactive / hoverable
![](/screenshots/charts-3.png)
