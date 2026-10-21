"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@affilhomes/shared/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { STRATEGY_LABELS, type JvRequestStatus } from "@/data/jv-requests";
import {
  JvApiError,
  acceptJvResponse,
  declineJvResponse,
  declineOtherJvResponses,
  formatJvDate,
  formatNaira,
  listMyJvRequests,
  setJvRequestStatus,
  toJvViewer,
  type JvRequestOwn,
  type JvViewer,
} from "@/lib/jv-api";
import {
  FiAlertCircle,
  FiClock,
  FiInbox,
  FiMail,
  FiPhone,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { Skeleton } from "@affilhomes/shared/ui";
import { SignInPrompt } from "../../../../components/common/SignInPrompt";
import { LuPen } from "react-icons/lu";
import { useConfirm } from "@/contexts/ConfirmDialog";

const STATUS_STYLES: Record<JvRequestStatus, string> = {
  open: "bg-primary/10 text-primary",
  matched: "bg-green-100 text-green-700",
  closed: "bg-muted/30 text-muted",
  withdrawn: "bg-muted/30 text-muted",
};

const STATUS_LABELS: Record<JvRequestStatus, string> = {
  open: "Open",
  matched: "Matched",
  closed: "Closed",
  withdrawn: "Withdrawn",
};

type ResponseStatus = JvRequestOwn["responses"][number]["status"];

const RESPONSE_LABELS: Record<ResponseStatus, string> = {
  pending: "Awaiting your decision",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn by subscriber",
};

const RESPONSE_STATUS_STYLES: Record<ResponseStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-muted/30 text-muted",
  withdrawn: "bg-muted/30 text-muted",
};

export default function MyJvRequestsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const viewer = useMemo(() => (user ? toJvViewer(user) : null), [user]);

  const [requests, setRequests] = useState<JvRequestOwn[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const { confirm } = useConfirm();

  const load = useCallback(async () => {
    if (!viewer) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listMyJvRequests(viewer);
      setRequests(data);
      setLoaded(true);
    } catch (err) {
      setLoadError(
        err instanceof JvApiError
          ? err.message
          : "We couldn't load your requests. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [viewer]);

  useEffect(() => {
    if (authLoading) return;
    if (!viewer) return;
    load();
  }, [authLoading, viewer, load]);

  const runAction =
    (
      key: string,
      action: (v: JvViewer) => Promise<void>,
      confirmMessage?: string,
    ) =>
    async () => {
      if (!viewer || pendingAction) return;
      if (
        confirmMessage &&
        !confirm({ message: confirmMessage, title: "Proceed with action?" })
      )
        return;
      setActionError(null);
      setPendingAction(key);
      try {
        await action(viewer);
        await load();
      } catch (err) {
        setActionError(
          err instanceof JvApiError
            ? err.message
            : "Something went wrong. Please try again.",
        );
      } finally {
        setPendingAction(null);
      }
    };

  if (authLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated || !viewer) {
    return (
      <SignInPrompt
        title="Sign in to see your JV requests"
        description="Track the requests you post and the responses you receive."
        callbackUrl="/jv-opportunity/mine"
      />
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My JV Requests</h1>
          <p className="mt-2 text-subtle">
            Only you can see the requests you post and the responses you
            receive.
          </p>
        </div>
        <Button href="/jv-opportunity/new" leftIcon={<FiPlus />}>
          Post a new request
        </Button>
      </header>

      {loadError && !loaded && (
        <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="mb-4 text-sm text-destructive">{loadError}</p>
          <Button
            variant="outline"
            onClick={load}
            isLoading={loading}
            loadingText="Retrying…"
          >
            Try again
          </Button>
        </div>
      )}

      {!loaded && loading && <RequestsSkeleton />}

      {loaded && requests.length === 0 && <EmptyState />}

      {loaded && requests.length > 0 && (
        <div className="space-y-6">
          {requests.map((r) => {
            const isOpen = r.status === "open";
            const canWithdraw = r.status === "open";
            const canClose = r.status === "matched";
            const anyPending = pendingAction !== null;

            return (
              <article
                key={r.id}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[r.status]}`}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted">
                    <FiClock className="h-3 w-3" aria-hidden />
                    Posted {formatJvDate(r.createdAt)}
                  </span>
                  <Button
                    aria-label="Edit Jv Request"
                    href={`/jv-opportunity/edit/${r.id}`}
                    size="xs"
                    variant="ghost"
                    className="p-2"
                  >
                    <LuPen />
                  </Button>
                </div>

                <h2 className="text-lg font-semibold text-foreground">
                  {r.requestType} · {r.area}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {formatNaira(r.budgetMin)} – {formatNaira(r.budgetMax)} ·{" "}
                  {STRATEGY_LABELS[r.strategyPreference]}
                </p>
                <p className="mt-4 whitespace-pre-line text-subtle line-clamp-6">
                  {r.description}
                </p>

                {(canWithdraw || canClose) && (
                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    {canWithdraw && (
                      <Button
                        variant="outline"
                        isLoading={pendingAction === `withdraw:${r.id}`}
                        loadingText="Withdrawing…"
                        disabled={
                          anyPending && pendingAction !== `withdraw:${r.id}`
                        }
                        onClick={runAction(
                          `withdraw:${r.id}`,
                          (v) => setJvRequestStatus(v, r.id, "withdrawn"),
                          "Withdraw this request? It will be removed from the market and any conversation threads will become read-only.",
                        )}
                      >
                        Withdraw request
                      </Button>
                    )}
                    {canClose && (
                      <Button
                        variant="outline"
                        isLoading={pendingAction === `close:${r.id}`}
                        loadingText="Closing…"
                        disabled={
                          anyPending && pendingAction !== `close:${r.id}`
                        }
                        onClick={runAction(
                          `close:${r.id}`,
                          (v) => setJvRequestStatus(v, r.id, "closed"),
                          "Close this request? Both sides will still be able to read the thread, but no new messages can be sent.",
                        )}
                      >
                        Close request
                      </Button>
                    )}
                  </div>
                )}

                <div className="mt-6 border-t border-border pt-5">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Responses ({r.responses.length})
                  </h3>

                  {r.responses.length === 0 && (
                    <p className="text-sm text-muted">
                      No responses yet. We&apos;ll notify you when someone
                      applies.
                    </p>
                  )}

                  <div className="space-y-4">
                    {r.responses.map((res) => {
                      const isPending = res.status === "pending";
                      const pendingLabel =
                        isPending && !isOpen
                          ? `Request ${STATUS_LABELS[r.status].toLowerCase()}`
                          : RESPONSE_LABELS[res.status];

                      return (
                        <div
                          key={res.id}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-muted">
                              {formatJvDate(res.createdAt)}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 font-medium ${RESPONSE_STATUS_STYLES[res.status]}`}
                            >
                              {pendingLabel}
                            </span>
                          </div>
                          <p className="whitespace-pre-line text-sm text-subtle">
                            {res.message}
                          </p>

                          {res.status === "accepted" && res.contact && (
                            <div className="mt-3 space-y-1 rounded-md bg-primary/5 p-3 text-sm text-foreground">
                              <p className="font-semibold">
                                {res.contact.name}
                              </p>
                              {res.contact.email && (
                                <a
                                  href={`mailto:${res.contact.email}`}
                                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                                >
                                  <FiMail className="h-3.5 w-3.5" aria-hidden />
                                  {res.contact.email}
                                </a>
                              )}
                              {res.contact.phone && (
                                <a
                                  href={`tel:${res.contact.phone}`}
                                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                                >
                                  <FiPhone
                                    className="h-3.5 w-3.5"
                                    aria-hidden
                                  />
                                  {res.contact.phone}
                                </a>
                              )}
                              <p className="mt-2 text-xs text-muted">
                                A private thread is now open between you and
                                this subscriber.
                              </p>
                            </div>
                          )}

                          {res.status === "pending" && (
                            <div className="mt-3 flex justify-end gap-3 flex-wrap">
                              <Button
                                variant="outline"
                                isLoading={
                                  pendingAction === `decline:${res.id}`
                                }
                                loadingText="Declining…"
                                disabled={
                                  anyPending &&
                                  pendingAction !== `decline:${res.id}`
                                }
                                onClick={runAction(
                                  `decline:${res.id}`,
                                  (v) => declineJvResponse(v, res.id),
                                  "Decline this response? The subscriber will be notified.",
                                )}
                              >
                                Decline
                              </Button>
                              {isOpen && (
                                <Button
                                  isLoading={
                                    pendingAction === `accept:${res.id}`
                                  }
                                  loadingText="Accepting…"
                                  disabled={
                                    anyPending &&
                                    pendingAction !== `accept:${res.id}`
                                  }
                                  onClick={runAction(
                                    `accept:${res.id}`,
                                    (v) => acceptJvResponse(v, res.id),
                                    "Accept this response? Your contact details will be shared and a private thread will open. The request will be marked as matched.",
                                  )}
                                >
                                  Accept and share contact
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {r.status === "matched" &&
                    r.responses.some((res) => res.status === "pending") && (
                      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-primary/5 p-4">
                        <p className="text-sm text-foreground">
                          You&apos;ve matched with a partner. Other responses
                          are still pending.
                        </p>
                        <Button
                          variant="outline"
                          isLoading={pendingAction === `decline-others:${r.id}`}
                          loadingText="Declining…"
                          disabled={
                            anyPending &&
                            pendingAction !== `decline-others:${r.id}`
                          }
                          onClick={runAction(
                            `decline-others:${r.id}`,
                            async (v) => {
                              await declineOtherJvResponses(v, r.id);
                            },
                            "Decline all other pending responses for this request?",
                          )}
                        >
                          Decline other responses
                        </Button>
                      </div>
                    )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-lg border border-destructive/40 bg-background p-4 shadow-lg sm:left-auto sm:right-4 sm:mx-0"
        >
          <div className="flex items-start gap-3">
            <FiAlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
              aria-hidden
            />
            <p className="flex-1 text-sm text-foreground">{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-muted transition-colors hover:text-foreground"
              aria-label="Dismiss error"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function RequestsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading your requests…</span>
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="mb-4 h-3 w-32" />
          <Skeleton className="mb-2 h-5 w-2/3" />
          <Skeleton className="mb-4 h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/30">
        <FiInbox className="h-6 w-6 text-muted" aria-hidden />
      </div>
      <h2 className="mb-1 text-lg font-semibold text-foreground">
        No requests yet
      </h2>
      <p className="mb-6 text-sm text-muted">
        Post your first JV request to connect with subscribers who can help.
      </p>
      <Button href="/jv-opportunity/new" leftIcon={<FiPlus />}>
        Post a request
      </Button>
    </div>
  );
}

function PageLoading() {
  return (
    <section
      className="mx-auto max-w-4xl px-4 py-12"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <RequestsSkeleton />
    </section>
  );
}
