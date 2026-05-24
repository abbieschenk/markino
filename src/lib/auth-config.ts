export function areSignupsEnabled() {
  const value = process.env.AUTH_SIGNUPS_ENABLED?.trim().toLowerCase();

  return value !== "false";
}
