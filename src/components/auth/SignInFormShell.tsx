"use client";

import dynamic from "next/dynamic";

import { AuthFormLoading } from "@/components/auth/AuthFormLoading";

const SignInForm = dynamic(
  () => import("@/components/auth/SignInForm").then((module) => module.SignInForm),
  {
    ssr: false,
    loading: () => <AuthFormLoading title="Sign In" />,
  },
);

type SignInFormShellProps = {
  signupsEnabled: boolean;
};

export function SignInFormShell({ signupsEnabled }: SignInFormShellProps) {
  return <SignInForm signupsEnabled={signupsEnabled} />;
}
