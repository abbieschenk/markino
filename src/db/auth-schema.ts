import {
  authAccounts,
  authSessions,
  authVerifications,
  users,
} from "@/db/schema";

export const authSchema = {
  user: users,
  session: authSessions,
  account: authAccounts,
  verification: authVerifications,
} as const;
