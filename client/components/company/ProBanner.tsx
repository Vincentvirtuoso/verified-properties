"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LuSparkles } from "react-icons/lu";

import { createClient } from "@affilhomes/shared/supabase/client";
import {
  getEntitlements,
  TRIAL_DAYS,
  type SubscriptionRow,
} from "@/lib/entitlements";
import { useAuth } from "@/contexts/AuthContext";

export function ProBanner() {
  const { user, authLoading } = useAuth();
  const pathname = usePathname();
  const [row, setRow] = useState<SubscriptionRow | null | undefined>(undefined);

  const companyId = user?.companyId?._id;
  const isOwner = companyId;

  useEffect(() => {
    if (pathname === "/company/pro") return;

    createClient()
      .from("company_subscriptions")
      .select(
        "status, trial_used, trial_ends_at, current_period_end, grace_until",
      )
      .eq("company_id", companyId)
      .maybeSingle()
      .then(({ data }) => setRow((data as SubscriptionRow) ?? null));
  }, [companyId, pathname]);

  if (pathname === "/company/pro" || row === undefined || authLoading)
    return null;

  const ent = getEntitlements(row);
  if (ent.tier === "pro") return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <LuSparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {ent.canStartTrial
              ? `Try Pro free for ${TRIAL_DAYS} days`
              : "Upgrade to Pro"}
          </p>
          <p className="text-xs text-muted">
            AI calling on every enquiry, plus JV access.
          </p>
        </div>
      </div>

      {isOwner ? (
        <Link
          href="/company/pro"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {ent.canStartTrial ? "Start free trial" : "View plans"}
        </Link>
      ) : (
        <p className="text-xs text-muted sm:text-right">
          Ask the company owner to upgrade.
        </p>
      )}
    </div>
  );
}
