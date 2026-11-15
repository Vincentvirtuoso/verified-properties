"use client";

import { useEffect, useState } from "react";
import { createClient } from "@affilhomes/shared/supabase/client";
import { canTrainDocuments, isLive, type AiRow } from "@/lib/ai-plans";

export function useAiPlan(ownerType: "company" | "agent", ownerId?: string) {
  const [row, setRow] = useState<AiRow | null>(null);
  const [ready, setReady] = useState(!ownerId);

  useEffect(() => {
    if (!ownerId) {
      setRow(null);
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);

    createClient()
      .from("ai_subscriptions")
      .select(
        "tier, status, trial_used, trial_ends_at, current_period_end, grace_until",
      )
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setRow((data as AiRow) ?? null);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerType, ownerId]);

  return {
    row,
    ready,
    live: isLive(row),
    canTrainDocuments: canTrainDocuments(row),
  };
}
