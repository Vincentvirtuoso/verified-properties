"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuCheck, LuCrown, LuSparkles } from "react-icons/lu";

import { createClient } from "@affilhomes/shared/supabase/client";
import {
  getEntitlements,
  PRO_PRICE_KOBO,
  TRIAL_DAYS,
  TRIAL_CALL_CAP,
  type SubscriptionRow,
} from "@/lib/entitlements";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Spinner } from "@affilhomes/shared/ui";
import { Alert } from "@affilhomes/shared/ui/Alert";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const STANDARD_FEATURES = [
  "Listing boost",
  "Team management",
  "Featured placement",
];
const PRO_EXTRA_FEATURES = [
  "AI chat",
  "AI calling on every enquiry",
  "Joint venture access",
];

export default function CompanyProPage() {
  const { user, authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [row, setRow] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId?._id;
  const isOwner = companyId;

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("company_subscriptions")
      .select(
        "status, trial_used, trial_ends_at, current_period_end, grace_until",
      )
      .eq("company_id", companyId)
      .maybeSingle();
    setRow((data as SubscriptionRow) ?? null);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Returning from Paystack: webhooks may land a few seconds later, so poll briefly
  useEffect(() => {
    if (searchParams.get("verify") !== "1") return;
    const timer = setInterval(load, 3000);
    const stop = setTimeout(() => clearInterval(timer), 30_000);
    return () => {
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, [searchParams, load]);

  const call = async (fn: "paystack-start-pro" | "paystack-cancel-pro") => {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = await createClient().functions.invoke(fn, {
        body: { companyId },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else await load();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted">Loading…</div>;
  }

  const ent = getEntitlements(row);
  const periodLabel = ent.periodEnd
    ? new Date(ent.periodEnd).toLocaleDateString("en-NG", {
        dateStyle: "medium",
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">
          Plan & billing
        </h1>
        <p className="mt-1 text-sm text-muted">
          Your current plan and what it includes.
        </p>
      </header>

      {/* Status */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <LuCrown className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            {ent.tier === "pro" ? "Pro" : "Standard"}
            {ent.isTrial && " · Free trial"}
            {row?.status === "canceled" && ent.tier === "pro" && " · Ends soon"}
          </p>
        </div>

        {ent.tier === "pro" && periodLabel && (
          <p className="mt-2 text-sm text-muted">
            {ent.isTrial
              ? `Trial ends ${periodLabel}. Your card is charged ${naira.format(PRO_PRICE_KOBO / 100)} after that.`
              : row?.status === "canceled"
                ? `Pro ends on ${periodLabel}, then your company moves to Standard.`
                : `Renews ${periodLabel}.`}
          </p>
        )}

        {row?.status === "past_due" && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning"
          >
            Your last payment failed. Pro stays on until the grace period ends.
            Update your card to keep it.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 text-xs text-destructive">
            {error}
          </p>
        )}

        {!isOwner && (
          <p className="mt-3 text-xs text-muted">
            Only the company owner can manage billing.
          </p>
        )}
      </div>

      {/* Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <PlanCard
          name="Standard"
          price="Free"
          current={ent.tier === "standard"}
          features={STANDARD_FEATURES}
        />
        <PlanCard
          name="Pro"
          price={`${naira.format(PRO_PRICE_KOBO / 100)} / month`}
          current={ent.tier === "pro"}
          highlighted
          features={[...STANDARD_FEATURES, ...PRO_EXTRA_FEATURES]}
          footnote={`Includes a ${TRIAL_DAYS}-day free trial. AI calls during the trial are capped at ${TRIAL_CALL_CAP}.`}
        />
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Owner actions */}
      {isOwner && (
        <div className="flex flex-wrap gap-3">
          {ent.canStartPro && (
            <Button
              onClick={() => call("paystack-start-pro")}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              isLoading={busy}
              leftIcon={<LuSparkles className="h-4 w-4" />}
            >
              {ent.canStartTrial
                ? `Start ${TRIAL_DAYS}-day free trial`
                : "Upgrade to Pro"}
            </Button>
          )}

          {ent.tier === "pro" && row?.status !== "canceled" && (
            <button
              onClick={() => call("paystack-cancel-pro")}
              disabled={busy}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 disabled:opacity-50"
            >
              Cancel subscription
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-muted">
        Payments are processed by Paystack. Pro continues until the end of the
        period you've paid for.
      </p>
    </div>
  );
}

function PlanCard({
  name,
  price,
  current,
  highlighted,
  features,
  footnote,
}: {
  name: string;
  price: string;
  current: boolean;
  highlighted?: boolean;
  features: string[];
  footnote?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card p-5",
        highlighted ? "border-primary/40 shadow-md" : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">{name}</p>
        {current && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            Current plan
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{price}</p>

      <ul className="mt-4 space-y-2 text-sm text-muted">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <LuCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {footnote && <p className="mt-4 text-xs text-muted">{footnote}</p>}
    </div>
  );
}
