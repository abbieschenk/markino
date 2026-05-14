"use client";

import dynamic from "next/dynamic";

import { AuthFormLoading } from "@/components/auth/AuthFormLoading";

export const SignInFormShell = dynamic(
  () => import("@/components/auth/SignInForm").then((module) => module.SignInForm),
  {
    ssr: false,
    loading: () => <AuthFormLoading title="Sign In" />,
  },
);
