"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestAdminAccess } from "@affilhomes/shared/supabase/admin";
import { Button, Textarea } from "@affilhomes/shared/ui";
import { useAuth } from "@/providers/AuthProvider";
import { createAdminBrowserClient } from "@/lib/supabase";

const MIN_LENGTH = 20;

export function RequestAccessForm() {
  const router = useRouter();
  const { user, logout, refreshUser, isLoading, status } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = message.trim();
  const tooShort = trimmed.length < MIN_LENGTH;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tooShort) {
      setError(`Please write at least ${MIN_LENGTH} characters.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestAdminAccess(trimmed);
      await refreshUser();
      router.replace("/pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (status === "unauthenticated" || !user) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm">You need to sign in first.</p>
        <Button
          type="button"
          fullWidth
          onClick={() => router.replace("/login")}
        >
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Request admin access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user?.email}. A super admin will review your request.
        </p>
      </div>
      <Textarea
        label="Why do you need admin access?"
        value={message}
        onChange={setMessage}
        maxLength={1000}
        rows={4}
        showCount
        placeholder="Your role on the team and what you'll do in the admin panel."
        error={error ?? undefined}
        description={`At least ${MIN_LENGTH} characters. Super admins read this when they decide.`}
      />

      <Button
        type="submit"
        disabled={tooShort || submitting}
        isLoading={submitting}
        fullWidth
      >
        Send request
      </Button>
      <Button
        type="button"
        variant="outline"
        fullWidth
        isLoading={isLoading}
        onClick={() => logout()}
      >
        Sign out
      </Button>
    </form>
  );
}
