"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuCheck } from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui/Button";
import { Centered } from "@affilhomes/shared/ui/Centered";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { JV_PLANS, isJvPlanId, type JvPlanId } from "@/data/jv-plans";
import {
  JvApiError,
  formatJvDate,
  getJvSubscription,
  subscribeToJv,
  toJvViewer,
} from "@/lib/jv-api";
import { formatNaira } from "@/utils";
import { SignInPrompt } from "@/components/common/SignInPrompt";

export default function SubscribePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SubscribeContent />
    </Suspense>
  );
}

function SubscribeContent() {
  const params = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const viewer = useMemo(() => (user ? toJvViewer(user) : null), [user]);

  const requestedPlan = params.get("plan");
  const [planId, setPlanId] = useState<JvPlanId>(
    isJvPlanId(requestedPlan) ? requestedPlan : "monthly",
  );
  const [current, setCurrent] = useState<{
    status: "active" | "lapsed";
    expiresAt: string;
  } | null>(null);
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribedUntil, setSubscribedUntil] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    if (!viewer || viewer.role === "viewer") {
      setChecking(false);
      return;
    }
    setChecking(true);
    setCheckError(null);
    try {
      const next = await getJvSubscription(viewer);
      setCurrent(next);
    } catch (err) {
      setCheckError(
        err instanceof JvApiError
          ? err.message
          : "We couldn't check your subscription. Please try again.",
      );
    } finally {
      setChecking(false);
    }
  }, [viewer]);

  useEffect(() => {
    if (authLoading || !viewer) return;
    loadSubscription();
  }, [authLoading, viewer, loadSubscription]);

  const handleSubscribe = async () => {
    if (!viewer || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { expiresAt } = await subscribeToJv(viewer, planId);
      setSubscribedUntil(expiresAt);
      setCurrent({ status: "active", expiresAt });
    } catch (err) {
      setError(
        err instanceof JvApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) return <PageLoading />;

  if (!isAuthenticated || !viewer) {
    return (
      <SignInPrompt
        title="Sign in to subscribe"
        description="JV subscriptions are for registered agents and companies."
        callbackUrl="/subscribe"
      />
    );
  }

  if (viewer.role === "viewer") {
    return (
      <Centered>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Subscriptions are for agents and companies
        </h1>
        <p className="mb-6 text-subtle">
          You can still post a partnership request and follow its responses.
        </p>
        <Button href="/jv-opportunity/new">Post a request</Button>
      </Centered>
    );
  }

  if (checking) return <PageLoading />;

  if (checkError) {
    return (
      <Centered>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          We couldn&apos;t load your subscription
        </h1>
        <p className="mb-6 text-subtle">{checkError}</p>
        <Button onClick={loadSubscription} isLoading={checking}>
          Try again
        </Button>
      </Centered>
    );
  }

  if (subscribedUntil) {
    return (
      <Centered>
        <LuCheck className="mx-auto mb-4 h-12 w-12 text-primary" aria-hidden />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          You&apos;re subscribed
        </h1>
        <p className="mb-6 text-subtle">
          Access runs until {formatJvDate(subscribedUntil)}.
        </p>
        <Button href="/jv-opportunity">Browse JV requests</Button>
      </Centered>
    );
  }

  const plan = JV_PLANS.find((p) => p.id === planId) ?? JV_PLANS[0];

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          JV Request Access
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-subtle">
          Subscribe to browse open partnership requests and respond to posters.
          Posters&apos; details stay hidden until they accept your response.
        </p>
        {current?.status === "active" && (
          <p className="mt-4 text-sm text-primary">
            Your access is active until {formatJvDate(current.expiresAt)}.
            Subscribing again extends it.
          </p>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {JV_PLANS.map((p) => {
          const isSelected = p.id === planId;
          const durationLabel =
            p.durationDays === 7
              ? "week"
              : p.durationDays === 30
                ? "month"
                : "year";
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlanId(p.id)}
              aria-pressed={isSelected}
              aria-label={`${p.name}, ${formatNaira(p.priceNaira)} per ${durationLabel}${p.popular ? ", most popular" : ""}`}
              className={`relative flex flex-col rounded-2xl border-2 bg-card p-6 text-left transition-all duration-300 ${
                isSelected
                  ? "border-primary shadow-xl"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {p.popular && (
                <span className="absolute -translate-y-1/2 right-6 top-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                  Most popular
                </span>
              )}
              <h2 className="text-xl font-bold text-foreground">{p.name}</h2>
              <p className="mt-3">
                <span className="text-3xl font-extrabold text-foreground">
                  {formatNaira(p.priceNaira)}
                </span>
                <span className="ml-1 text-subtle">/ {durationLabel}</span>
              </p>
              <ul className="mt-5 grow space-y-2.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-subtle"
                  >
                    <LuCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-stretch justify-between gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-muted">Selected plan</p>
          <p className="text-lg font-semibold text-foreground">
            {plan.name} · {formatNaira(plan.priceNaira)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            onClick={handleSubscribe}
            isLoading={busy}
            loadingText="Processing…"
            disabled={busy}
          >
            Subscribe to {plan.name}
          </Button>
        </div>
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
      <span className="sr-only">Loading subscription options…</span>
      <div className="mb-10 flex flex-col items-center gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6">
            <Skeleton className="mb-3 h-6 w-24" />
            <Skeleton className="mb-5 h-9 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="h-5 w-48" />
      </div>
    </main>
  );
}
