import "server-only";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import { authSchema } from "@/db/auth-schema";

const HANDLE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function normalizeHandle(value: string) {
  return value.toLowerCase().trim();
}

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

function validateHandle(handle: string) {
  if (handle.length < 3 || handle.length > 32) {
    throw APIError.from("BAD_REQUEST", {
      code: "INVALID_HANDLE_LENGTH",
      message: "Handle must be between 3 and 32 characters.",
    });
  }

  if (!HANDLE_PATTERN.test(handle)) {
    throw APIError.from("BAD_REQUEST", {
      code: "INVALID_HANDLE_FORMAT",
      message:
        "Handle can only contain lowercase letters, numbers, and single separators (. _ -).",
    });
  }
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
        required: true,
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
          const handle =
            "handle" in user && typeof user.handle === "string" && user.handle
              ? normalizeHandle(user.handle)
              : createHandle(user.name, user.email);

          validateHandle(handle);

          const existingUser = await db.query.users.findFirst({
            where: eq(authSchema.user.handle, handle),
            columns: { id: true },
          });

          if (existingUser) {
            throw APIError.from("BAD_REQUEST", {
              code: "HANDLE_TAKEN",
              message: "Handle is already taken.",
            });
          }

          return {
            data: {
              ...user,
              displayName: user.name,
              handle,
            },
          };
        },
      },
      update: {
        async before(user) {
          const nextData = { ...user } as Record<string, unknown>;

          if ("handle" in nextData && typeof nextData.handle === "string") {
            const normalizedHandle = normalizeHandle(nextData.handle);
            validateHandle(normalizedHandle);
            nextData.handle = normalizedHandle;
          }

          if (!("name" in nextData) || !nextData.name) {
            return { data: nextData };
          }

          return {
            data: {
              ...nextData,
              displayName: nextData.name,
            },
          };
        },
      },
    },
  },
  emailAndPassword: { enabled: true },
});
