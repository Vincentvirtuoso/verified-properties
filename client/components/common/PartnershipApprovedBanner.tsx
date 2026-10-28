"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuCircleCheck, LuX } from "react-icons/lu";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@affilhomes/shared/types";
import { createClient } from "@affilhomes/shared/supabase/client";

export function PartnershipApprovedBanner() {
  const { user } = useAuth();
  const userId = user?._id;
  const companyId = user?.companyId?._id ?? null;
  const noticeKey = companyId ? `partnership-approved:${companyId}` : null;

  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId || !noticeKey || user?.activeRole !== Role.Company) return;

    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("user_dismissed_notices")
      .select("notice_key")
      .eq("user_id", userId)
      .eq("notice_key", noticeKey)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Could not check dismissed notices:", error);
          setDismissed(true);
          return;
        }
        setDismissed(!!data);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, noticeKey, user?.activeRole]);

  const handleClose = async () => {
    if (!userId || !noticeKey) return;

    setDismissed(true);
    const { error } = await createClient()
      .from("user_dismissed_notices")
      .upsert(
        { user_id: userId, notice_key: noticeKey },
        { onConflict: "user_id,notice_key", ignoreDuplicates: true },
      );

    if (error) {
      console.error("Could not save dismissal:", error);
      setDismissed(false);
    }
  };

  if (!user || user.activeRole !== Role.Company || !noticeKey) return null;
  if (dismissed !== false) return null;

  return (
    <div
      role="status"
      className="flex w-full items-center gap-3 border-b border-success/70 bg-success text-success-foreground p-3 "
    >
      <LuCircleCheck aria-hidden="true" className="h-6 w-6 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">Your partnership is approved</p>
        <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
          Your account is now a company account. Your listings can be featured.
        </p>
      </div>

      <Link
        href="/company/dashboard"
        className="shrink-0 pt-0.5 text-xs font-semibold underline underline-offset-2 hover:text-primary"
      >
        Open dashboard
      </Link>

      <button
        type="button"
        onClick={handleClose}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LuX size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
