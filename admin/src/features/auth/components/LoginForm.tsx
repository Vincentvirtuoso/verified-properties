"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LuEye, LuEyeOff, LuLock, LuMail } from "react-icons/lu";

import { Button } from "@affilhomes/shared/ui";

import { useZodForm } from "@/hooks/useZodForm";
import { useAuth } from "@/providers/AuthProvider";

import { loginSchema } from "../schemas/login.schema";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/dashboard";

  const { login, status, authLoading, authError, clearError } = useAuth();
  const [showPw, setShowPw] = useState(false);

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
    }
  }, [status, next, router]);

  const onSubmit = handleSubmit(async (data) => {
    clearError();
    try {
      await login(data);
      // Redirect happens in the useEffect above.
    } catch {
      // authError is set on the context.
    }
  });

  const disabled = authLoading || status === "loading";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <div className="relative">
          <LuMail
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            aria-invalid={!!errors.email}
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring aria-invalid:border-destructive"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <LuLock
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={values.password}
            onChange={(e) => setField("password", e.target.value)}
            aria-invalid={!!errors.password}
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring aria-invalid:border-destructive"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:bg-secondary"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <LuEyeOff size={16} /> : <LuEye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      {authError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {authError}
        </div>
      )}

      <Button type="submit" disabled={disabled} className="h-11 w-full">
        {authLoading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

