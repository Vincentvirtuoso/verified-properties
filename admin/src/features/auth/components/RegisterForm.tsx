"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuCheck, LuMail, LuUser } from "react-icons/lu";

import { Button, Field, Textarea } from "@affilhomes/shared/ui";

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

  const inputClassName = "h-10 text-sm";

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
      <Field
        id="name"
        autoComplete="name"
        value={values.name}
        onChange={(e) => setField("name", e.target.value)}
        aria-invalid={!!errors.name}
        label="Full Name"
        size={20}
        inputClassName={inputClassName}
        icon={LuUser}
        error={errors.name}
        placeholder="Jane Doe"
      />
      <Field
        icon={LuMail}
        inputClassName={inputClassName}
        label="Email"
        id="email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(e) => setField("email", e.target.value)}
        aria-invalid={!!errors.email}
        error={errors.email}
        placeholder="jane-doe@gmail.com"
      />
      <Field
        inputClassName={inputClassName}
        label="Password"
        id="password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(e) => setField("password", e.target.value)}
        aria-invalid={!!errors.password}
        error={errors.password}
        placeholder="••••••••"
      />
      <Field
        inputClassName={inputClassName}
        label="Confirm Password"
        id="confirm-password"
        type="password"
        autoComplete="new-password"
        value={values.confirm}
        onChange={(e) => setField("confirm", e.target.value)}
        aria-invalid={!!errors.confirm}
        error={errors.confirm}
        placeholder="••••••••"
      />

      <Textarea
        id="reason"
        rows={4}
        value={values.reason}
        onChange={(value) => setField("reason", value)}
        aria-invalid={!!errors.reason}
        label="Why do you need access?"
        error={errors.reason}
        placeholder="Briefly describe your role and what you'll be doing in the admin panel."
      />

      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="h-11 w-full"
        isLoading={submitting}
      >
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
