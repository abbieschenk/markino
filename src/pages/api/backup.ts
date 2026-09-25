import type { APIRoute } from "astro";

import {
  createBackup,
  previewBackup,
  restoreBackup,
  validateBackup,
} from "@/server/data-backup";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function authorized(user: App.Locals["user"]) {
  return user?.role === "superadmin";
}

export const GET: APIRoute = async ({ locals, url }) => {
  if (!authorized(locals.user)) return json({ error: "Superadmin access is required." }, 403);

  try {
    const backup = await createBackup(url.searchParams.get("includeTmdbMetadata") === "true");
    const date = backup.exportedAt.slice(0, 10);
    return new Response(JSON.stringify(backup), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="markino-backup-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export backup", error);
    return json({ error: "Unable to create the backup." }, 500);
  }
};

export const POST: APIRoute = async ({ locals, request, url }) => {
  if (!authorized(locals.user)) return json({ error: "Superadmin access is required." }, 403);
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return json({ error: "Cross-origin backup requests are not allowed." }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "The uploaded file is not valid JSON." }, 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) return json({ error: "Invalid request." }, 400);
  const requestBody = body as Record<string, unknown>;
  if (requestBody.intent !== "preview" && requestBody.intent !== "restore") return json({ error: "Invalid backup intent." }, 400);

  try {
    const backup = validateBackup(requestBody.backup);
    if (requestBody.intent === "preview") return json({ preview: previewBackup(backup) });
    if (requestBody.confirmation !== "REPLACE") return json({ error: "Type REPLACE exactly to confirm restoration." }, 400);
    try {
      await restoreBackup(backup);
      return json({ success: true });
    } catch (error) {
      console.error("Failed to restore backup", error);
      return json({ error: "Unable to restore the backup. No data was changed." }, 500);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The backup is invalid.";
    return json({ error: message }, 400);
  }
};
