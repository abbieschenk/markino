"use client";

import { SignInForm } from "@/components/auth/SignInForm";

type SignInFormShellProps = {
  signupsEnabled: boolean;
};

export function SignInFormShell({ signupsEnabled }: SignInFormShellProps) {
  return <SignInForm signupsEnabled={signupsEnabled} />;
}
