"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { LuLock, LuMail } from "react-icons/lu";

import { Button, Field } from "@affilhomes/shared/ui";

import { useZodForm } from "@/hooks/useZodForm";
import { useAuth } from "@/providers/AuthProvider";

import { loginSchema } from "../schemas/login.schema";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/dashboard";

  const { login, status, authLoading, authError, clearError } = useAuth();

  const { values, errors, setField, handleSubmit } = useZodForm(loginSchema, {
    email: "",
    password: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(next);
      router.refresh();
    } else if (status === "pending") {
      router.replace("/pending");
    } else if (status === "rejected") {
      router.replace("/rejected");
    } else if (status === "suspended") {
      router.replace("/suspended");
    } else if (status === "unrequested") {
      router.replace("/request-access");
    }  }, [status, next, router]);

  const onSubmit = handleSubmit(async (data) => {
    clearError();
    try {
      await login(data);
    } catch {}
  });

  const disabled = authLoading || status === "loading";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field
        label="Email"
        iconElement={
          <LuMail size={14} className="pointer-events-none text-muted" />
        }
        id="email"
        type="email"
        autoComplete="email"
        autoFocus
        placeholder="you@example.com"
        value={values.email}
        onChange={(e) => setField("email", e.target.value)}
        aria-invalid={!!errors.email}
        error={errors.email}
      />
      <div className="flex flex-col">
        <Field
          type={"password"}
          autoComplete="current-password"
          placeholder="••••••••"
          value={values.password}
          onChange={(e) => setField("password", e.target.value)}
          aria-invalid={!!errors.password}
          iconElement={
            <LuLock size={14} className="pointer-events-none text-muted" />
          }
          label="Password"
          error={errors.password}
        />
        <Link
          href="/forgot-password"
          className="text-xs font-medium text-primary hover:underline place-self-end mt-1"
        >
          Forgot password?
        </Link>
      </div>

      {authError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {authError}
        </div>
      )}

      <Button
        type="submit"
        className="h-11 w-full"
        isLoading={disabled}
        loadingText={status === "loading" ? "Checking token…" : "Signing in…"}
      >
        Sign in
      </Button>
    </form>
  );
}
