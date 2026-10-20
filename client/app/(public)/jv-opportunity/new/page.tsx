"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@affilhomes/shared/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { JvApiError, createJvRequest, toJvViewer } from "@/lib/jv-api";
import {
  JvRequestForm,
  type JvRequestPayload,
} from "../_components/JvRequestForm";

export default function NewJvRequestPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const viewer = useMemo(() => (user ? toJvViewer(user) : null), [user]);

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (payload: JvRequestPayload) => {
    if (!viewer) return;
    setApiError(null);
    setSubmitting(true);
    try {
      await createJvRequest(viewer, payload);
      router.push("/jv-opportunity/mine");
    } catch (err) {
      setApiError(
        err instanceof JvApiError
          ? err.message
          : "Something went wrong. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !viewer) {
    return (
      <main className="mx-auto max-w-md px-4 py-24">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-foreground">
            Sign in to post a JV request
          </h1>
          <p className="mb-6 text-sm text-muted">
            Your request stays anonymous until you accept a response.
          </p>
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Post a JV request
        </h1>
        <p className="mt-2 text-subtle">
          Share what you need. You choose who to accept.
        </p>
      </header>

      <JvRequestForm
        submitLabel="Post request"
        submitLoadingLabel="Posting…"
        submitting={submitting}
        apiError={apiError}
        onSubmit={handleSubmit}
        cancelHref="/jv-opportunity/mine"
      />
    </main>
  );
}
