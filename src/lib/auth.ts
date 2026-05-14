import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import { authSchema } from "@/db/auth-schema";

function createHandle(name: string, email: string) {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
    "user";

  const suffix = crypto.randomUUID().slice(0, 8);
  const stem = base.slice(0, 23).replace(/-+$/g, "") || "user";

  return `${stem}-${suffix}`;
}

const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000";

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is not set.");
}

export const auth = betterAuth({
  baseURL,
  secret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  user: {
    fields: {
      name: "displayName",
    },
    additionalFields: {
      handle: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    fields: {
      userId: "userId",
    },
  },
  account: {
    fields: {
      userId: "userId",
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          if ("handle" in user && user.handle) {
            return {
              data: {
                ...user,
                displayName: user.name,
              },
            };
          }

          return {
            data: {
              ...user,
              displayName: user.name,
              handle: createHandle(user.name, user.email),
            },
          };
        },
      },
      update: {
        async before(user) {
          if (!("name" in user) || !user.name) {
            return;
          }

          return {
            data: {
              ...user,
              displayName: user.name,
            },
          };
        },
      },
    },
  },
  emailAndPassword: { enabled: true },
});
