import { defineMiddleware } from "astro:middleware";

import { CURRENT_USER_COOKIE, getLocalProfileById } from "@/lib/local-profiles";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = await getLocalProfileById(
    context.cookies.get(CURRENT_USER_COOKIE)?.value,
  );

  return next();
});
