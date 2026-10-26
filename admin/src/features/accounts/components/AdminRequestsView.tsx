"use client";

import { useState } from "react";
import { LuMail, LuRefreshCw, LuUser } from "react-icons/lu";
import {
  fetchAdminRequests,
  superAdminReviewAdminRequest,
  type AdminRequest,
  type AdminRequestStatus,
} from "@affilhomes/shared/supabase/admin";
import { Alert } from "@affilhomes/shared/ui/Alert";
import {
  AskReason,
  Empty,
  FilterChips,
  ReloadButton,
  StatusPill,
} from "@/components/ui/ReviewActions";
import { useAdminList } from "@/hooks/useAdminList";

type Filter = "pending" | "approved" | "rejected" | "all";
type Tone = "neutral" | "success" | "warning" | "danger";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const STATUS: Record<AdminRequestStatus, { label: string; tone: Tone }> = {
  pending: { label: "Awaiting decision", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

const APPROVE_SUGGESTIONS = [
  "Identity confirmed.",
  "Verified team member.",
  "Approved by super admin.",
];

const REJECT_SUGGESTIONS = [
  "Insufficient justification.",
  "Account does not match a team member.",
  "Not eligible for admin access.",
];

export function AdminRequestsTab() {
  const [filter, setFilter] = useState<Filter>("pending");

  const { rows, error, reload, loading } = useAdminList<AdminRequest>(
    () => fetchAdminRequests(filter === "all" ? null : filter),
    [filter],
  );

  const emptyCopy =
    filter === "pending"
      ? {
          title: "No pending requests",
          message: "New requests for admin access will appear here.",
        }
      : {
          title: "No requests",
          message: "Nothing to show for this filter.",
        };

  return (
    <section className="space-y-4" aria-label="Admin requests">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips<Filter>
          label="Request status"
          value={filter}
          onChange={setFilter}
          options={FILTER_OPTIONS}
        />
        <div className="flex items-center gap-3 text-xs text-muted">
          {rows && (
            <span className="tabular-nums">
              {rows.length} {rows.length === 1 ? "request" : "requests"}
            </span>
          )}
          <ReloadButton reload={reload} loading={loading} />
        </div>
      </div>

      {error && <Alert onRetry={reload}>{error}</Alert>}

      {!rows && !error && (
        <ul
          aria-label="Loading requests"
          aria-busy="true"
          className="space-y-3"
        >
          {[0, 1].map((i) => (
            <li
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </ul>
      )}

      {rows && rows.length === 0 && (
        <Empty title={emptyCopy.title} message={emptyCopy.message} />
      )}

      {rows && rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onChanged={reload}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function RequestCard({
  request: r,
  onChanged,
}: {
  request: AdminRequest;
  onChanged: () => void;
}) {
  const status = STATUS[r.status];
  const isPending = r.status === "pending";
  const submitted = new Date(r.createdAt).toLocaleDateString();

  return (
    <li className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/30 text-muted"
          >
            <LuUser size={18} />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground">
                {r.userName || "Unnamed user"}
              </p>
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
            </div>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <LuMail size={12} aria-hidden="true" />
              {r.userEmail ?? "No email on file"}
            </p>
            <p className="text-xs text-muted-foreground">
              Requested {submitted}
            </p>
            {r.message && (
              <p className="pt-2 text-sm text-foreground">
                <span className="font-medium">Message: </span>
                {r.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {isPending && (
        <footer className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <AskReason
            label="Approve access"
            prompt={`Why is ${r.userName || "this user"} being granted admin access?`}
            placeholder="Explain why this request is approved."
            confirmLabel="Approve"
            destructive={false}
            suggestions={APPROVE_SUGGESTIONS}
            onConfirm={async (reason) => {
              await superAdminReviewAdminRequest(r.id, true, reason);
              onChanged();
            }}
          />
          <AskReason
            label="Reject request"
            prompt={`Why is the admin request from ${r.userName || "this user"} being rejected?`}
            placeholder="Explain why this request is rejected."
            confirmLabel="Reject"
            destructive
            suggestions={REJECT_SUGGESTIONS}
            onConfirm={async (reason) => {
              await superAdminReviewAdminRequest(r.id, false, reason);
              onChanged();
            }}
          />
        </footer>
      )}

      {/* {!isPending && r.reviewReason && (
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          {r.reviewReason}
        </p>
      )} */}
    </li>
  );
}
