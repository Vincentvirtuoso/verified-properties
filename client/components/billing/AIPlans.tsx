"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LuCheck, LuTriangleAlert } from "react-icons/lu";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";

import { createClient } from "@affilhomes/shared/supabase/client";
import { Button, VerifiedBadge } from "@affilhomes/shared/ui";
import { Alert } from "@affilhomes/shared/ui/Alert";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton";
import { cn } from "@/lib/utils";
import { isLive } from "@/lib/ai-plans";

export type Tier = "starter" | "growth" | "business";

type Row = {
  tier: Tier;
  status: "free" | "trialing" | "active" | "past_due" | "canceled";
  trial_used: boolean;
  trial_ends_at: string | null;
  current_period_end: string | null;
  grace_until: string | null;
};

type Plan = {
  tier: Tier;
  name: string;
  price: number;
  numbers: number;
  minutes: number;
  cps: number;
  documents: boolean;
};

const PLANS: Plan[] = [
  {
    tier: "starter",
    name: "Starter",
    price: 100_000,
    numbers: 1,
    minutes: 300,
    cps: 5,
    documents: false,
  },
  {
    tier: "growth",
    name: "Growth",
    price: 200_000,
    numbers: 1,
    minutes: 1000,
    cps: 10,
    documents: true,
  },
  {
    tier: "business",
    name: "Business",
    price: 400_000,
    numbers: 3,
    minutes: 2500,
    cps: 10,
    documents: true,
  },
];

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const fmt = (value: string) =>
  new Date(value).toLocaleDateString("en-NG", { dateStyle: "medium" });

function planFeatures(plan: Plan) {
  return [
    `${plan.numbers} phone number${plan.numbers > 1 ? "s" : ""}`,
    `${plan.minutes.toLocaleString("en-NG")} call minutes a month`,
    `${plan.cps} calls at the same time`,
    plan.documents ? "FAQ and document training" : "FAQ training",
    "AI chat included",
  ];
}

async function functionError(error: unknown) {
  const response = (error as { context?: Response }).context;
  if (response) {
    try {
      const body = await response.json();
      if (body?.error) return body.error as string;
    } catch {
      // Not JSON, fall through.
    }
  }
  return "Something went wrong. Please try again.";
}

interface AIPlansProps {
  ownerType: "company" | "agent";
  ownerId: string;
  canManage: boolean;
  verified: boolean;
  breadcrumbs: { href?: string; label: string }[];
}

export function AIPlans({
  ownerType,
  ownerId,
  canManage,
  verified,
  breadcrumbs,
}: AIPlansProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const verifying = searchParams.get("verify") === "1";
  const live = isLive(row);
  const current = PLANS.find((p) => p.tier === row?.tier);
  const trialAvailable = canManage && verified && !live && !row?.trial_used;
  const canBuy =
    canManage &&
    verified &&
    (!live || row?.status === "trialing" || row?.status === "canceled");

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("ai_subscriptions")
      .select(
        "tier, status, trial_used, trial_ends_at, current_period_end, grace_until",
      )
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .maybeSingle();
    const next = (data as Row) ?? null;
    setRow(next);
    return next;
  }, [ownerType, ownerId]);

  const cancelPlan = async () => {
     const trialing = row?.status === "trialing";
     if (
       !window.confirm(
         trialing
           ? "End your trial? Chat stops at the end of the trial, and nothing will be charged."
           : "Cancel your plan? You keep access until the current period ends, and it won't renew.",
       )
     ) {
       return;
     }
    setBusy("cancel");
    setError(null);
    try {
      const { error } = await createClient().functions.invoke("ai-cancel", {
        body: {
          ownerType,
          companyId: ownerType === "company" ? ownerId : undefined,
        },
      });
      if (error) throw error;
      await load();
    } catch (e) {
      setError(await functionError(e));
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!verifying) return;
    setConfirming(true);
    setTimedOut(false);
    let tries = 0;

    const timer = setInterval(async () => {
      tries += 1;
      const next = await load();
      if (isLive(next)) {
        clearInterval(timer);
        setConfirming(false);
        router.replace(pathname);
      } else if (tries >= 10) {
        clearInterval(timer);
        setConfirming(false);
        setTimedOut(true);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [verifying, load, router, pathname]);

  const start = async (tier: Tier, trial: boolean) => {
    const key = `${trial ? "trial" : "buy"}:${tier}`;
    setBusy(key);
    setError(null);
    try {
      const { data, error } = await createClient().functions.invoke(
        "ai-subscribe",
        {
          body: {
            ownerType,
            companyId: ownerType === "company" ? ownerId : undefined,
            tier,
            trial,
          },
        },
      );
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError("Couldn't start payment. Please try again.");
    } catch (e) {
      setError(await functionError(e));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6" aria-busy="true">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  let statusTitle = "No AI plan yet";
  let statusDetail = !verified
    ? "Plans open once your verification is approved."
    : canManage
      ? "Choose a plan below."
      : "Only people with billing access can choose a plan.";

  if (live && current && row) {
    if (row.status === "trialing") {
      statusTitle = `${current.name} trial`;
      statusDetail = `Trial ends ${fmt(row.trial_ends_at!)}. Chat only. Subscribe now to add phone numbers and calls.`;
    } else if (row.status === "active") {
      statusTitle = `${current.name} plan`;
      statusDetail = `Renews ${fmt(row.current_period_end!)}.`;
    } else if (row.status === "canceled") {
      statusTitle = `${current.name} plan, ending`;
      statusDetail = `Ends ${fmt(row.current_period_end!)}. AI calling stops for new enquiries after that.`;
    } else if (row.status === "past_due") {
      statusTitle = `${current.name} plan, payment failed`;
      statusDetail = `Your plan stays on until ${fmt(row.grace_until!)}, then it stops.`;
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Breadcrumbs items={breadcrumbs} />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            AI calling plans
          </h1>
          {verified && <VerifiedBadge size="md" />}
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          Manage your AI assistant, phone numbers, calling capacity and monthly
          usage.
        </p>
      </header>

      {confirming && (
        <Alert>
          Confirming your payment. This usually takes a few seconds.
        </Alert>
      )}

      {timedOut && (
        <Alert variant="warning" onRetry={load} retryLabel="Check again">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Payment confirmation is taking longer than expected
            </p>
            <p className="text-sm leading-relaxed text-muted">
              We haven't received confirmation yet. Your payment may still be
              processing. Check your subscription status or contact support if
              the issue persists.
            </p>
          </div>
        </Alert>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Subscription overview
              </span>

              {live && row && (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    row.status === "active" && "bg-success/10 text-success",
                    row.status === "trialing" && "bg-info/10 text-info",
                    row.status === "past_due" &&
                      "bg-destructive/10 text-destructive",
                    row.status === "canceled" && "bg-warning/10 text-warning",
                  )}
                >
                  {row.status === "trialing"
                    ? "Free trial"
                    : row.status === "active"
                      ? "Active"
                      : row.status === "past_due"
                        ? "Payment issue"
                        : "Ending"}
                </span>
              )}

              {!live && (
                <span className="rounded-full bg-muted/10 px-2.5 py-1 text-[11px] font-medium text-muted">
                  No active subscription
                </span>
              )}
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {statusTitle}
            </h2>

            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              {statusDetail}
            </p>
          </div>

          {live && current && (
            <div className="shrink-0 border-t border-border pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <p className="text-xs text-muted">Current plan</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {current.name}
              </p>
              <p className="text-sm text-muted">
                {naira.format(current.price)} / month
              </p>
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="border-t border-destructive/20 bg-destructive/5 px-5 py-3 text-sm text-destructive sm:px-6"
          >
            {error}
          </div>
        )}
        {canManage && live && row?.status !== "canceled" && (
          <div className="flex p-2">
            <Button
              variant="danger"
              size="sm"
              disabled={!!busy}
              fullWidth
              isLoading={busy === "cancel"}
              onClick={cancelPlan}
            >
              Cancel plan
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              Explore plans
            </h2>
            <p className="text-sm text-muted">
              Find the right capacity for your business.
            </p>
          </div>

          <p className="text-xs text-muted">All prices are billed monthly.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = live && row?.tier === plan.tier;
            const isOtherLive = live && row?.tier !== plan.tier;
            const isTrialBusy = busy === `trial:${plan.tier}`;
            const isBuyBusy = busy === `buy:${plan.tier}`;

            return (
              <article
                key={plan.tier}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-5 transition-colors sm:p-6",
                  isCurrent
                    ? "border-primary/50 ring-1 ring-primary/10"
                    : "border-border hover:border-primary/30",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {plan.name}
                  </h3>

                  {isCurrent && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                      Current plan
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                      {naira.format(plan.price)}
                    </span>
                    <span className="text-sm text-muted">/ month</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">Billed monthly</p>
                </div>

                <div className="my-6 border-t border-border pt-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
                    What's included
                  </p>

                  <ul className="space-y-4">
                    {planFeatures(plan).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-foreground"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                          <LuCheck className="h-3 w-3" />
                        </span>
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto space-y-3">
                  {(!live ||
                    row?.status === "trialing" ||
                    row?.status === "canceled") &&
                    canManage &&
                    verified && (
                      <>
                        {trialAvailable && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!!busy || confirming}
                            isLoading={isTrialBusy}
                            onClick={() => start(plan.tier, true)}
                            fullWidth
                          >
                            Start 7-day trial
                          </Button>
                        )}

                        {canBuy && (
                          <Button
                            size="sm"
                            fullWidth
                            disabled={!!busy || confirming}
                            isLoading={isBuyBusy}
                            onClick={() => start(plan.tier, false)}
                          >
                            {live ? "Subscribe now" : "Subscribe"}
                          </Button>
                        )}
                      </>
                    )}

                  {isCurrent && row?.status !== "trialing" && (
                    <div className="rounded-lg bg-primary/5 px-3 py-3 text-center text-xs font-medium text-primary">
                      You're currently on this plan
                    </div>
                  )}

                  {isOtherLive && (
                    <div className="rounded-lg bg-muted/10 px-3 py-3 text-center text-xs text-muted">
                      Plan switching is coming soon.
                    </div>
                  )}

                  {!live && !canManage && (
                    <p className="rounded-lg bg-muted/10 px-3 py-3 text-center text-xs text-muted">
                      Billing access is required to subscribe.
                    </p>
                  )}

                  {!live && canManage && !verified && (
                    <p className="rounded-lg bg-muted/10 px-3 py-3 text-center text-xs text-muted">
                      Complete account verification to subscribe.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {trialAvailable && (
        <section className="rounded-xl border border-border bg-muted/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LuCheck className="h-4 w-4" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Try AI calling before subscribing
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                Your 7-day trial includes chat functionality and up to 50
                assistant replies. Phone numbers and AI calls are unavailable
                during the trial.
              </p>
              <p className="text-xs text-muted">
                A ₦50 card verification charge is made and refunded.
              </p>
            </div>
          </div>
        </section>
      )}

      <footer className="flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Payments are securely processed by Paystack.</p>
        <p>Your subscription is linked to this account.</p>
      </footer>
    </div>
  );
}
