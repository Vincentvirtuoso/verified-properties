"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuCheck, LuMail, LuUser } from "react-icons/lu";

import { Button } from "@affilhomes/shared/ui";

import { useZodForm } from "@/hooks/useZodForm";
import { useAuth } from "@/providers/AuthProvider";

import { requestAdminAccess } from "../api/register.api";
import { registerSchema } from "../schemas/register.schema";

export function RegisterForm() {
  const router = useRouter();
  const { status } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { needsConfirm: boolean }>(null);

  const { values, errors, setField, handleSubmit } = useZodForm(
    registerSchema,
    {
      name: "",
      email: "",
      password: "",
      confirm: "",
      reason: "",
    },
  );

  // Once the profile trigger fires and AuthProvider resolves, route
  // based on the resulting status. Covers the "bootstrap super_admin"
  // case where the user is signed in straight after signup.
  useEffect(() => {
    if (!done) return;
    if (status === "authenticated") {
      router.replace("/dashboard");
      router.refresh();
    } else if (status === "pending") {
      router.replace("/pending");
    }
  }, [done, status, router]);

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await requestAdminAccess(data);
      setDone(result);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not submit request",
      );
    } finally {
      setSubmitting(false);
    }
  });

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-success/10 text-success">
          <LuCheck size={20} />
        </div>
        <h2 className="text-base font-semibold">Request submitted</h2>
        <p className="mt-1 text-sm text-muted">
          {done.needsConfirm
            ? "Check your inbox to confirm your email. Your application will be reviewed after that."
            : "Your application is under review. You can sign in to check its status."}
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Full name
        </label>
        <div className="relative">
          <LuUser
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            aria-invalid={!!errors.name}
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring aria-invalid:border-destructive"
          />
        </div>
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => setField("password", e.target.value)}
            aria-invalid={!!errors.password}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring aria-invalid:border-destructive"
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirm
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={(e) => setField("confirm", e.target.value)}
            aria-invalid={!!errors.confirm}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring aria-invalid:border-destructive"
          />
          {errors.confirm && (
            <p className="text-xs text-destructive">{errors.confirm}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-medium">
          Why do you need access?
        </label>
        <textarea
          id="reason"
          rows={4}
          value={values.reason}
          onChange={(e) => setField("reason", e.target.value)}
          aria-invalid={!!errors.reason}
          placeholder="Briefly describe your role and what you'll be doing in the admin panel."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring aria-invalid:border-destructive"
        />
        {errors.reason && (
          <p className="text-xs text-destructive">{errors.reason}</p>
        )}
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <Button type="submit" disabled={submitting} className="h-11 w-full">
        {submitting ? "Submitting…" : "Request access"}
      </Button>

      <p className="text-center text-xs text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
