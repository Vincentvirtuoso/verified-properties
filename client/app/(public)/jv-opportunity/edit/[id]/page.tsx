"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@affilhomes/shared/ui/Button";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  JvApiError,
  getMyJvRequest,
  updateJvRequest,
  toJvViewer,
  type JvRequestOwn,
  type JvRequestPayload,
  EDIT_COOLDOWN_HOURS,
} from "@/lib/jv-api";
import {
  JvRequestForm,
  type JvRequestFormValues,
} from "../../_components/JvRequestForm";

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function formatRemaining(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes || !hours)
    parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  return parts.join(" and ");
}

type LoadStatus = "loading" | "ready" | "not_found" | "error";

export default function EditJvRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const viewer = useMemo(() => (user ? toJvViewer(user) : null), [user]);
  const now = useNow(30_000);

  const [request, setRequest] = useState<JvRequestOwn | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !viewer) return;
    let cancelled = false;
    setStatus("loading");

    getMyJvRequest(viewer, id)
      .then((data) => {
        if (cancelled) return;
        setRequest(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof JvApiError && err.status === 404) {
          setStatus("not_found");
        } else {
          setLoadError(
            err instanceof JvApiError
              ? err.message
              : "We couldn't load this request.",
          );
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, viewer, id]);

  const handleSubmit = async (payload: JvRequestPayload) => {
    if (!viewer) return;
    setApiError(null);
    setSubmitting(true);
    try {
      await updateJvRequest(viewer, id, payload);

      router.push("/jv-opportunity/mine");
    } catch (err) {
      setApiError(
        err instanceof JvApiError
          ? err.message
          : "Something went wrong. Try again.",
      );
      setSubmitting(false);
    }
  };

  if (authLoading) return <EditSkeleton />;

  if (!isAuthenticated || !viewer) {
    return (
      <CenteredMessage
        title="Sign in to edit this request"
        description="You can only edit requests you posted."
        action={
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (status === "loading") return <EditSkeleton />;

  if (status === "not_found") {
    return (
      <CenteredMessage
        title="Request not found"
        description="This request doesn't exist or you don't have access to it."
      />
    );
  }

  if (status === "error") {
    return (
      <CenteredMessage
        title="Couldn't load this request"
        description={loadError ?? ""}
      />
    );
  }

  if (!request) return null;

  if (request.status !== "open") {
    return (
      <CenteredMessage
        title="This request can't be edited"
        description="Only open requests can be edited. Once a request is matched, withdrawn, or closed, its details are locked."
      />
    );
  }

  const remainingMs = request.nextEditAt
    ? new Date(request.nextEditAt).getTime() - now
    : 0;

  if (remainingMs > 0) {
    return (
      <CenteredMessage
        title="Edit limit reached"
        description={`To prevent spam, requests can only be updated every ${EDIT_COOLDOWN_HOURS} hours. You can edit this request again in ${formatRemaining(remainingMs)}.`}
      />
    );
  }

  const initialValues: JvRequestFormValues = {
    area: request.area,
    requestType: request.requestType,
    budgetMin: String(request.budgetMin),
    budgetMax: String(request.budgetMax),
    strategyPreference: request.strategyPreference,
    description: request.description,
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Edit JV request</h1>
        <p className="mt-2 text-subtle">
          Update the details of your request. Response threads are preserved.
        </p>
      </header>

      <JvRequestForm
        initialValues={initialValues}
        submitLabel="Save changes"
        submitLoadingLabel="Saving…"
        submitting={submitting}
        apiError={apiError}
        onSubmit={handleSubmit}
        cancelHref="/jv-opportunity/mine"
      />
    </main>
  );
}

function CenteredMessage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="mb-2 text-xl font-semibold text-foreground">{title}</h1>
      <p className="mb-6 text-sm text-muted">{description}</p>
      {action ?? (
        <Button asChild>
          <Link href="/jv-opportunity/mine">Back to my requests</Link>
        </Button>
      )}
    </main>
  );
}

function EditSkeleton() {
  return (
    <main
      className="mx-auto max-w-2xl px-4 py-12"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading request…</span>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="flex justify-end gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </main>
  );
}
