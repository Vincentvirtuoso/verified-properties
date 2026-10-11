"use client";

import { useState } from "react";
import Link from "next/link";
import { errorText, fetchAdminJV, reviewJV, unpublishJV, type AdminJV, type ReviewStatus } from "@/lib/supabase/admin";
import { formatCompactPrice } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { askReason, Empty, FilterChips, ReviewActions, StatusPill } from "./ReviewActions";
import { useAdminList } from "./useAdminList";

export function JVTab() {
  const [filter, setFilter] = useState<ReviewStatus>("pending");
  const { rows, error, reload } = useAdminList<AdminJV>(() => fetchAdminJV(filter), [filter]);

  const takeDown = async (r: AdminJV) => {
    const reason = askReason(`Take "${r.title}" off the site?`);
    if (!reason) return;
    try {
      await unpublishJV(r.id, reason);
      reload();
    } catch (e) {
      window.alert(errorText(e));
    }
  };

  return (
    <section className="space-y-4">
      <FilterChips<ReviewStatus>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "pending", label: "Waiting for review" },
          { value: "approved", label: "Approved" },
          { value: "changes_requested", label: "Changes requested" },
          { value: "rejected", label: "Rejected" },
        ]}
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!rows ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {r.status === "active" ? (
                      <Link href={`/jv-properties/${r.slug}`} target="_blank" className="hover:underline">
                        {r.title}
                      </Link>
                    ) : (
                      r.title
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.ownerName} · owner {r.ownerVerified ? "verified" : "not verified"} · {r.city}, {r.state}
                    {r.landValue ? ` · land ${formatCompactPrice(r.landValue)}` : ""}
                    {r.roi ? ` · ROI ${r.roi}%` : ""}
                  </p>
                  {r.reviewNote && <p className="text-xs text-muted-foreground">Note: {r.reviewNote}</p>}
                </div>
                <StatusPill>{r.status === "active" ? "live" : r.reviewStatus.replace("_", " ")}</StatusPill>
                {r.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => takeDown(r)}>
                    Take down
                  </Button>
                )}
              </div>
              {r.reviewStatus === "pending" && (
                <ReviewActions
                  labels={{ approve: "Approve & publish", more_info: "Request changes" }}
                  onDecide={async (d, reason) => {
                    await reviewJV(r.id, d, reason);
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
