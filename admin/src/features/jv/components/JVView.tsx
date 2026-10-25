"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { LuArrowUpRight, LuMapPin, LuRefreshCw } from "react-icons/lu";
import {
  fetchAdminJV,
  reviewJV,
  unpublishJV,
  type AdminJV,
  type ReviewStatus,
} from "@affilhomes/shared/supabase/admin";
import { formatCompactPrice } from "@affilhomes/shared/utils";
import {
  AskReason,
  Empty,
  FilterChips,
  ReviewActions,
  StatusPill,
} from "@/components/ui/ReviewActions";
import { useAdminList } from "@/hooks/useAdminList";
import { Alert } from "@affilhomes/shared/ui/Alert";

type Tone = "neutral" | "success" | "warning" | "danger";

const FILTER_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: "pending", label: "Waiting for review" },
  { value: "approved", label: "Approved" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "rejected", label: "Rejected" },
];

const EMPTY_COPY: Record<ReviewStatus, { title: string; message: string }> = {
  pending: {
    title: "Nothing waiting for review",
    message: "New JV requests will appear here as owners submit them.",
  },
  approved: {
    title: "No approved JVs",
    message: "Approved opportunities will be listed here.",
  },
  changes_requested: {
    title: "No JVs awaiting changes",
    message: "JVs sent back to owners appear here until they resubmit.",
  },
  rejected: {
    title: "No rejected JVs",
    message: "Rejected opportunities will be listed here.",
  },
  none: {
    title: "Nothing here",
    message: "",
  },
};

const humanize = (value: string) => value.replace(/_/g, " ");

function jvStatus(jv: AdminJV): { label: string; tone: Tone } {
  if (jv.status === "active") return { label: "Live", tone: "success" };
  switch (jv.reviewStatus) {
    case "pending":
      return { label: "Waiting", tone: "warning" };
    case "changes_requested":
      return { label: "Changes requested", tone: "warning" };
    case "approved":
      return { label: "Approved", tone: "success" };
    case "rejected":
      return { label: "Rejected", tone: "danger" };
    default:
      return { label: humanize(jv.reviewStatus), tone: "neutral" };
  }
}

export function JVTab() {
  const [filter, setFilter] = useState<ReviewStatus>("pending");
  const [openId, setOpenId] = useState<string | null>(null);

  const { rows, error, reload } = useAdminList<AdminJV>(
    () => fetchAdminJV(filter),
    [filter],
  );

  // Collapse any open review when the filter changes.
  const changeFilter = (next: ReviewStatus) => {
    setOpenId(null);
    setFilter(next);
  };

  return (
    <section className="space-y-4" aria-label="Joint ventures">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips<ReviewStatus>
          label="JV status"
          value={filter}
          onChange={changeFilter}
          options={FILTER_OPTIONS}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {rows && (
            <span className="tabular-nums">
              {rows.length} {rows.length === 1 ? "JV" : "JVs"}
            </span>
          )}
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LuRefreshCw size={12} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {error && <Alert onRetry={reload}>{error}</Alert>}

      {!rows && !error && (
        <ul aria-label="Loading JVs" aria-busy="true" className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </ul>
      )}

      {rows && rows.length === 0 && (
        <Empty
          title={EMPTY_COPY[filter].title}
          message={EMPTY_COPY[filter].message}
        />
      )}

      {rows && rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((jv) => (
            <JVCard
              key={jv.id}
              jv={jv}
              expanded={openId === jv.id}
              onToggle={() =>
                setOpenId((current) => (current === jv.id ? null : jv.id))
              }
              onChanged={reload}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function JVCard({
  jv,
  expanded,
  onToggle,
  onChanged,
}: {
  jv: AdminJV;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const panelId = `${uid}-panel`;

  const isLive = jv.status === "active";
  const canReview = jv.reviewStatus === "pending";
  const status = jvStatus(jv);
  const owner = jv.ownerVerified
    ? { label: "Owner verified", tone: "success" as const }
    : { label: "Owner not verified", tone: "warning" as const };

  return (
    <li>
      <article
        aria-labelledby={titleId}
        className="space-y-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-sm sm:p-5"
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            >
              <LuMapPin size={18} />
            </span>
            <div className="min-w-0">
              <h3
                id={titleId}
                className="truncate font-semibold text-foreground"
              >
                {isLive ? (
                  <Link
                    href={`/jv-properties/${jv.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {jv.title}
                    <LuArrowUpRight size={14} aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </Link>
                ) : (
                  jv.title
                )}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {jv.ownerName} · {jv.city}, {jv.state}
              </p>
            </div>
          </div>
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </header>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <StatusPill tone={owner.tone}>{owner.label}</StatusPill>
          {jv.landValue !== null && (
            <span className="rounded-full bg-secondary px-2 py-0.5 tabular-nums text-muted-foreground">
              Land {formatCompactPrice(jv.landValue)}
            </span>
          )}
          {jv.roi !== null && (
            <span className="rounded-full bg-secondary px-2 py-0.5 tabular-nums text-muted-foreground">
              ROI {jv.roi}%
            </span>
          )}
        </div>

        {jv.reviewNote && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Note: </span>
            {jv.reviewNote}
          </p>
        )}

        {(isLive || canReview) && (
          <footer className="flex flex-wrap items-start gap-3 border-t border-border pt-4">
            {isLive && (
              <div className="min-w-0 flex-1">
                <AskReason
                  label="Take down"
                  prompt={`Why is "${jv.title}" being taken down?`}
                  placeholder="Explain the reason. The owner will see this."
                  confirmLabel="Take down"
                  destructive
                  suggestions={[
                    "Duplicate of another opportunity.",
                    "Details or figures are misleading.",
                    "Owner is no longer able to proceed.",
                  ]}
                  onConfirm={async (reason) => {
                    await unpublishJV(jv.id, reason);
                    onChanged();
                  }}
                />
              </div>
            )}
            {canReview && (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={onToggle}
                className="ml-auto inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {expanded ? "Close review" : "Review JV"}
              </button>
            )}
          </footer>
        )}

        {expanded && canReview && (
          <div id={panelId} className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              JV decision
            </p>
            <ReviewActions
              labels={{
                approve: "Approve & publish",
                more_info: "Request changes",
              }}
              onDecide={async (decision, reason) => {
                await reviewJV(jv.id, decision, reason);
                onChanged();
              }}
            />
          </div>
        )}
      </article>
    </li>
  );
}
