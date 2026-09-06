import type { APIRoute } from "astro";

import { auth } from "@/lib/auth";

export const ALL: APIRoute = (context) => auth.handler(context.request);
