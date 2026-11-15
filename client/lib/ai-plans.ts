export const FAQ_LIMIT = 50;
export const DOCUMENT_MAX_MB = 50;

export type AiRow = {
  tier: "starter" | "growth" | "business";
  status: "free" | "trialing" | "active" | "past_due" | "canceled";
  trial_used: boolean;
  trial_ends_at: string | null;
  current_period_end: string | null;
  grace_until: string | null;
};

export function isLive(row: AiRow | null, now = Date.now()) {
  if (!row) return false;
  const t = (d: string | null) => (d ? new Date(d).getTime() : 0);
  return (
    (row.status === "trialing" && t(row.trial_ends_at) > now) ||
    (["active", "canceled"].includes(row.status) &&
      t(row.current_period_end) > now) ||
    (row.status === "past_due" && t(row.grace_until) > now)
  );
}

export function canTrainDocuments(row: AiRow | null) {
  return isLive(row) && (row?.tier === "growth" || row?.tier === "business");
}
