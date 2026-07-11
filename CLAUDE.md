@AGENTS.md

## Package Manager
- Use `pnpm` for this project.
- Run scripts with `pnpm run <script>` rather than `npm run <script>`.
- Add dependencies with `pnpm add` rather than `npm install`.

## Database Schema
- Every table, including many-to-many tables, must include a unique GUID-based `id` column.
