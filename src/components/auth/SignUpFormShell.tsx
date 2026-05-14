"use client";

import dynamic from "next/dynamic";

import { AuthFormLoading } from "@/components/auth/AuthFormLoading";

export const SignUpFormShell = dynamic(
  () => import("@/components/auth/SignUpForm").then((module) => module.SignUpForm),
  {
    ssr: false,
    loading: () => <AuthFormLoading title="Create Account" />,
  },
);
