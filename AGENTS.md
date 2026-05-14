<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project
Markino is a quiet, dense movie watch/ranking app for personal and collaborative movie tracking.

## Features

Markino lets users log movies they have watched and rank them in a dense table view.

- Log movies watched, including:
  - Title of Movie
  - Date watched
  - Language watched in
  - Watch status:
    - Watched (default)
    - DNF (did not finish)
    - DNS (did not start)
  - Watched With
    - Optional list of other tagged users
    - this makes the movie appear in the table of both users

### Ranking / preference order

Users can manually sort movies by personal preference.

This ranking order must be persisted in the database.

The table should support:
- manual preference order
- sorting by title
- sorting by date watched
- sorting by language
- filtering by watched status
- filtering by watched-with user

The persisted preference order should not be lost when temporary table sorting/filtering is applied.

## Stack
- Next.js (App Router)
- TypeScript
- shadcn, incl. shadcn Data Table
- Better Auth
- Drizzle ORM
- Neon Postgres
- Vercel

## Design Decisions
The design for this site is:
- Data over flashy components
- Japanese UI denseness with Swiss design
- No gradients, no clutter

## Code Style
- Use server components by default
- Only use client components when necessary
- Keep components small and named clearly
- Prefer explicit types
- Avoid unnecessary abstraction

## Commands
- Run typecheck before finishing substantial changes
- Run lint before finishing substantial changes

## Workflow
- Make small, reviewable changes
- Explain tradeoffs briefly
- Do not introduce new libraries without explaining why
