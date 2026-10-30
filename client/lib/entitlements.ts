export const PRO_PRICE_KOBO = 30_000_000; 
export const TRIAL_DAYS = 7;
export const TRIAL_CALL_CAP = 20;
export const VERIFY_CHARGE_KOBO = 5_000; 
export const PAST_DUE_GRACE_DAYS = 3;

export type SubscriptionRow = {
  status: "free" | "trialing" | "active" | "past_due" | "canceled";
  trial_used: boolean;
  trial_ends_at: string | null;
  current_period_end: string | null;
  grace_until: string | null;
};

const ts = (d?: string | null) => (d ? new Date(d).getTime() : 0);

export function getEntitlements(
  row: SubscriptionRow | null,
  now: Date = new Date(),
) {
  const n = now.getTime();

  const inTrial = row?.status === "trialing" && ts(row.trial_ends_at) > n;
  const inPaidPeriod =
    (row?.status === "active" || row?.status === "canceled") &&
    ts(row.current_period_end) > n;
  const inGrace = row?.status === "past_due" && ts(row.grace_until) > n;

  const isPro = inTrial || inPaidPeriod || inGrace;

  return {
    tier: isPro ? ("pro" as const) : ("standard" as const),
    isTrial: inTrial,
    aiCalling: isPro,
    aiChat: isPro,
    aiCallCap: inTrial ? TRIAL_CALL_CAP : null,
    jvAccess: isPro,
    canStartPro: !isPro,
    canStartTrial: !isPro && !row?.trial_used,
    periodEnd:
      row?.status === "trialing"
        ? row.trial_ends_at
        : (row?.current_period_end ?? null),
  };
}
