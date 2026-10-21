"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { LuLock, LuShieldAlert, LuInbox } from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui/Button";
import { Textarea } from "@affilhomes/shared/ui/Textarea";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { STRATEGY_LABELS } from "@/data/jv-requests";
import {
  JvApiError,
  formatJvDate,
  formatNaira,
  getJvAccess,
  listOpenJvRequests,
  respondToJvRequest,
  toJvViewer,
  type JvAccessReason,
  type JvRequestPublic,
} from "@/lib/jv-api";
import { SignInPrompt } from "@/components/common/SignInPrompt";
import { Centered } from "@affilhomes/shared/ui/Centered";
import { VerifiedBadge } from "@affilhomes/shared/ui";

const MIN_MESSAGE = 20;
const MAX_MESSAGE = 1000;

export const REQUEST_PLACEHOLDERS: Record<string, string> = {
  "Land partnership": "/jv/placeholders/land-partnership.webp",
  "Project co-funding": "/jv/placeholders/project-cofunding.webp",
  "Joint development": "/jv/placeholders/joint-development.webp",
  Other: "/jv/placeholders/other.webp",
};

export default function JvOpportunityPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const viewer = useMemo(() => (user ? toJvViewer(user) : null), [user]);

  const [access, setAccess] = useState<{
    canBrowse: boolean;
    reason: JvAccessReason;
  } | null>(null);
  const [requests, setRequests] = useState<JvRequestPublic[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!viewer) return;
    setLoading(true);
    setLoadError(null);
    try {
      const nextAccess = await getJvAccess(viewer);
      setAccess(nextAccess);
      setRequests(nextAccess.canBrowse ? await listOpenJvRequests(viewer) : []);
      setLoaded(true);
    } catch (err) {
      setLoadError(
        err instanceof JvApiError
          ? err.message
          : "We couldn't load JV requests. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [viewer]);

  useEffect(() => {
    if (authLoading || !viewer) return;
    load();
  }, [authLoading, viewer, load]);

  const openReply = (id: string) => {
    setReplyingTo(id);
    setMessage("");
    setRespondError(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setMessage("");
    setRespondError(null);
  };

  const handleRespond = async (requestId: string) => {
    if (!viewer || pendingAction) return;
    const trimmed = message.trim();

    if (trimmed.length < MIN_MESSAGE) {
      setRespondError(
        `Please add a little more detail (at least ${MIN_MESSAGE} characters).`,
      );
      return;
    }

    setRespondError(null);
    setPendingAction(`respond:${requestId}`);
    try {
      await respondToJvRequest(viewer, requestId, trimmed);
      setReplyingTo(null);
      setMessage("");
      await load();
    } catch (err) {
      setRespondError(
        err instanceof JvApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPendingAction(null);
    }
  };

  if (authLoading) return <PageLoading />;

  if (!isAuthenticated || !viewer) {
    return (
      <SignInPrompt
        title="Sign in to continue"
        description="JV requests are for registered agents and companies."
        callbackUrl="/jv-opportunity"
      />
    );
  }

  if (!loaded && loading) return <PageLoading />;

  if (loadError && !loaded) {
    return (
      <Centered>
        <LuShieldAlert
          className="mx-auto mb-4 h-10 w-10 text-destructive"
          aria-hidden
        />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          We couldn&apos;t load JV requests
        </h1>
        <p className="mb-6 text-subtle">{loadError}</p>
        <Button onClick={load} isLoading={loading} loadingText="Retrying…">
          Try again
        </Button>
      </Centered>
    );
  }

  if (!access) return <PageLoading />;

  if (!access.canBrowse) {
    const isViewer = access.reason === "role_not_eligible";
    return (
      <Centered>
        <LuLock className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {isViewer
            ? "JV requests are for agents and companies"
            : "Subscribe to see JV requests"}
        </h1>
        <p className="mb-6 text-subtle">
          {isViewer
            ? "You can still post a partnership request and follow its responses."
            : "An active subscription lets you browse open requests and respond to posters."}
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          {!isViewer && (
            <Button href="/subscribe" fullWidth>
              View plans
            </Button>
          )}
          <Button href="/jv-opportunity/new" variant="outline" fullWidth>
            Post a request
          </Button>
          <Button href="/jv-opportunity/mine" variant="outline" fullWidth>
            My requests
          </Button>
        </div>
      </Centered>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">JV Requests</h1>
          <p className="mt-2 max-w-2xl text-subtle">
            Browse open partnership requests. Posters stay anonymous until they
            accept your response.
          </p>
        </div>
        <Button href="/jv-opportunity/mine" variant="outline">
          My requests
        </Button>
      </header>

      {requests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <LuInbox className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-foreground">
            No open requests right now
          </h2>
          <p className="text-sm text-muted">
            Check back soon — new partnership requests are posted regularly.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {requests.map((r) => {
          const verified = r.posterLabel === "Verified poster";
          const isReplying = replyingTo === r.id;
          const isSending = pendingAction === `respond:${r.id}`;
          const anyPending = pendingAction !== null;

          // Map the request type to the placeholder image
          const placeholderSrc =
            REQUEST_PLACEHOLDERS[r.requestType] ||
            REQUEST_PLACEHOLDERS["Other"];

          return (
            <article
              key={r.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card md:flex-row"
            >
              {/* Image Container */}
              <div className="relative h-48 w-full shrink-0 border-b border-border bg-muted/30 md:h-auto md:w-72 md:border-b-0 md:border-r">
                <Image
                  src={placeholderSrc}
                  alt={r.requestType}
                  fill
                  sizes="(max-width: 768px) 100vw, 288px"
                  className="object-cover"
                />
              </div>

              {/* Content Container */}
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                      verified
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/30 text-muted"
                    }`}
                  >
                    {verified ? (
                      <VerifiedBadge
                        className="h-3.5 w-3.5"
                        aria-hidden
                        showText={false}
                      />
                    ) : (
                      <LuShieldAlert className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {r.posterLabel}
                  </span>
                  <span className="text-muted">
                    Posted {formatJvDate(r.createdAt)}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-foreground">
                  {r.requestType} · {r.area}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {formatNaira(r.budgetMin)} – {formatNaira(r.budgetMax)} ·{" "}
                  {STRATEGY_LABELS[r.strategyPreference]}
                </p>
                <p className="mt-4 whitespace-pre-line text-subtle">
                  {r.description}
                </p>

                {!isReplying && (
                  <div className="mt-auto flex justify-end pt-5">
                    {r.alreadyResponded ? (
                      <span className="text-sm text-muted">
                        You&apos;ve already responded
                      </span>
                    ) : (
                      <Button onClick={() => openReply(r.id)}>Respond</Button>
                    )}
                  </div>
                )}

                {isReplying && (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      label="Your response"
                      value={message}
                      onChange={setMessage}
                      placeholder="Briefly introduce your interest and what you can bring to this request."
                      rows={3}
                      maxLength={MAX_MESSAGE}
                      showCount
                      disabled={isSending}
                      error={respondError ?? undefined}
                      description={`At least ${MIN_MESSAGE} characters. The poster sees this alongside your profile.`}
                    />
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={cancelReply}
                        disabled={isSending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleRespond(r.id)}
                        isLoading={isSending}
                        loadingText="Sending…"
                        disabled={!message.trim() || (anyPending && !isSending)}
                      >
                        Send response
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

function PageLoading() {
  return (
    <main
      className="mx-auto max-w-5xl px-4 py-12"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading JV requests…</span>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-card md:flex-row"
          >
            <Skeleton className="h-48 w-full shrink-0 rounded-none md:h-auto md:w-72" />
            <div className="flex flex-1 flex-col p-6">
              <Skeleton className="mb-4 h-4 w-40" />
              <Skeleton className="mb-2 h-5 w-2/3" />
              <Skeleton className="mb-4 h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
              <div className="mt-auto flex justify-end pt-6">
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
