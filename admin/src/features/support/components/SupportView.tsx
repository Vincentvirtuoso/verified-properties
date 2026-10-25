"use client";

import { useState } from "react";
import {
  closeTicket,
  fetchTickets,
  type AdminTicket,
} from "@affilhomes/shared/supabase/admin";
import {
  Empty,
  FilterChips,
  ReviewActions,
  StatusPill,
} from "@/components/ui/ReviewActions";
import { useAdminList } from "@/hooks/useAdminList";

type Filter = "open" | "closed";

export function SupportTab() {
  const [filter, setFilter] = useState<Filter>("open");
  const { rows, error, reload } = useAdminList<AdminTicket>(
    () => fetchTickets(filter),
    [filter],
  );

  return (
    <section className="space-y-4">
      <FilterChips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "open", label: "Open" },
          { value: "closed", label: "Closed" },
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
        <Empty message="No messages."/>
      ) : (
        <ul className="space-y-3">
          {rows.map((t) => (
            <li
              key={t.id}
              className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    {t.subject || "No subject"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.name} ·{" "}
                    <a
                      href={`mailto:${t.email}`}
                      className="text-primary hover:underline"
                    >
                      {t.email}
                    </a>{" "}
                    · {new Date(t.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-foreground">
                    {t.message}
                  </p>
                  {t.adminNote && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Closed: {t.adminNote}
                    </p>
                  )}
                </div>
                <StatusPill>{t.status}</StatusPill>
              </div>
              {t.status === "open" && (
                <ReviewActions
                  labels={{ approve: "Close ticket" }}
                  onDecide={async (_d, note) => {
                    await closeTicket(t.id, note);
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
