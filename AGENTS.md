<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project
Markino is a quiet, dense movie watch/ranking app for personal and collaborative movie tracking.

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
