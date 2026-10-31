"use client";

import { useEffect, useState } from "react";
import { createClient } from "@affilhomes/shared/supabase/client";
import { getEntitlements, type SubscriptionRow } from "@/lib/entitlements";

export function useEntitlements(companyId?: string) {
  const [row, setRow] = useState<SubscriptionRow | null>(null);
  const [ready, setReady] = useState(!companyId);

  useEffect(() => {
    if (!companyId) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    createClient()
      .from("company_subscriptions")
      .select(
        "status, trial_used, trial_ends_at, current_period_end, grace_until",
      )
      .eq("company_id", companyId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setRow((data as SubscriptionRow) ?? null);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { ...getEntitlements(row), ready };
}
