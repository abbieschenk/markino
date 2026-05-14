"use client";

import dynamic from "next/dynamic";

import { AuthFormLoading } from "@/components/auth/auth-form-loading";

export const SignUpFormShell = dynamic(
  () =>
    import("@/components/auth/sign-up-form").then((module) => module.SignUpForm),
  {
    ssr: false,
    loading: () => <AuthFormLoading title="Create Account" />,
  },
);
