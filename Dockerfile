FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@10.7.1 --activate
COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@10.7.1 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db/schema.ts ./src/db/schema.ts
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
