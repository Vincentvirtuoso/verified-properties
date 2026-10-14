"use client";

import { useState } from "react";
import {
  fetchAppeals,
  resolveAppeal,
  type AdminAppeal,
} from "@affilhomes/shared/supabase/admin";
import { Empty, FilterChips, ReviewActions, StatusPill } from "./ReviewActions";
import { useAdminList } from "./useAdminList";

const SUBJECT_LABEL: Record<string, string> = {
  listing: "Listing",
  video: "Video",
  verification: "Verification",
  identity_document: "ID document",
  property_document: "Property document",
  jv: "JV listing",
  suspension: "Suspension",
};

type Filter = "open" | "accepted" | "declined";

export function AppealsTab() {
  const [filter, setFilter] = useState<Filter>("open");
  const { rows, error, reload } = useAdminList<AdminAppeal>(
    () => fetchAppeals(filter),
    [filter],
  );

  return (
    <section className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Accepting an appeal puts the item back in its review queue (or lifts the
        suspension). Declining keeps the decision.
      </p>
      <FilterChips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "open", label: "Open" },
          { value: "accepted", label: "Accepted" },
          { value: "declined", label: "Declined" },
        ]}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!rows ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li
              key={a.id}
              className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    {SUBJECT_LABEL[a.subjectType] ?? a.subjectType} appeal from{" "}
                    {a.userName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.userEmail} · {new Date(a.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-foreground">
                    {a.message}
                  </p>
                  {a.adminReply && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Reply: {a.adminReply}
                    </p>
                  )}
                </div>
                <StatusPill>{a.status}</StatusPill>
              </div>
              {a.status === "open" && (
                <ReviewActions
                  decisions={["approve", "reject"]}
                  labels={{ approve: "Accept & reopen", reject: "Decline" }}
                  placeholder="Reply to the user (required, saved in the audit log)"
                  onDecide={async (d: "approve", reply: string) => {
                    await resolveAppeal(a.id, d === "approve", reply);
                    reload();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
