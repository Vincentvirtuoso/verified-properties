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
  EDIT_COOLDOWN_HOURS,
  JvRequestPayload,
} from "@/lib/jv-api";
import {
  JvRequestForm,
  type JvRequestFormValues,
} from "../../_components/JvRequestForm";

type Params = { id: string };

const EDIT_COOLDOWN_MS = EDIT_COOLDOWN_HOURS * 60 * 60 * 1000;

function formatTimeRemaining(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.ceil((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0)
    return `${hours} hour${hours !== 1 ? "s" : ""} and ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

export default function EditJvRequestPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const viewer = useMemo(() => (user ? toJvViewer(user) : null), [user]);

  const [request, setRequest] = useState<JvRequestOwn | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !viewer) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      setNotFound(false);
      try {
        const data = await getMyJvRequest(viewer, id);
        if (!cancelled) setRequest(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof JvApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(
            err instanceof JvApiError
              ? err.message
              : "We couldn't load this request.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
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
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <EditSkeleton />;

  if (!isAuthenticated || !viewer) {
    return (
      <main className="mx-auto max-w-md px-4 py-24">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-foreground">
            Sign in to edit this request
          </h1>
          <p className="mb-6 text-sm text-muted">
            You can only edit requests you posted.
          </p>
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (loading) return <EditSkeleton />;

  if (notFound) {
    return (
      <CenteredMessage
        title="Request not found"
        description="This request doesn't exist or you don't have access to it."
      />
    );
  }

  if (loadError) {
    return (
      <CenteredMessage
        title="Couldn't load this request"
        description={loadError}
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

  const lastUpdatedStr = request.updatedAt || request.createdAt;

  const lastUpdatedTime = new Date(lastUpdatedStr).getTime();
  const timeSinceUpdate = Date.now() - lastUpdatedTime;

  if (timeSinceUpdate < EDIT_COOLDOWN_MS) {
    const remainingMs = EDIT_COOLDOWN_MS - timeSinceUpdate;
    return (
      <CenteredMessage
        title="Edit limit reached"
        description={`To prevent spam, requests can only be updated every ${EDIT_COOLDOWN_HOURS} hours. You can edit this request again in ${formatTimeRemaining(remainingMs)}.`}
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
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="mb-2 text-xl font-semibold text-foreground">{title}</h1>
      <p className="mb-6 text-sm text-muted">{description}</p>
      <Button asChild>
        <Link href="/jv-opportunity/mine">Back to my requests</Link>
      </Button>
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
        <Skeleton className="h-16 w-full" />
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
