"use client";

import dynamic from "next/dynamic";

import { AuthFormLoading } from "@/components/auth/auth-form-loading";

export const SignInFormShell = dynamic(
  () =>
    import("@/components/auth/sign-in-form").then((module) => module.SignInForm),
  {
    ssr: false,
    loading: () => <AuthFormLoading title="Sign In" />,
  },
);
