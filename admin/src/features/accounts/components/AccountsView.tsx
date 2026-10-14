"use client";

import { useState } from "react";
import {
  errorText,
  searchAccounts,
  suspendAccount,
  unsuspendAccount,
  type AdminAccount,
} from "@affilhomes/shared/supabase/admin";
import { Button } from "@affilhomes/shared/ui/Button";
import { useAdminList } from "@/hooks/useAdminList";
import { askReason, Empty } from "@/components/data/ReviewActions";
import { StatusPill } from "@/components/ui/ReviewActions";

export function AccountsTab() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [onlySuspended, setOnlySuspended] = useState(false);
  const { rows, error, reload } = useAdminList<AdminAccount>(
    () => searchAccounts(query, onlySuspended),
    [query, onlySuspended],
  );

  const toggle = async (a: AdminAccount) => {
    const reason = askReason(
      a.suspended
        ? `Lift the suspension on ${a.name}? Their listings stay hidden until they're approved again.`
        : `Suspend ${a.name}? All their live listings will be hidden and they won't be able to publish.`,
    );
    if (!reason) return;
    try {
      if (a.suspended) await unsuspendAccount(a.subjectType, a.id, reason);
      else await suspendAccount(a.subjectType, a.id, reason);
      reload();
    } catch (e) {
      window.alert(errorText(e));
    }
  };

  return (
    <section className="space-y-4">
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search name or email"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <Button size="sm" type="submit">
          Search
        </Button>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlySuspended}
            onChange={(e) => setOnlySuspended(e.target.checked)}
          />
          Suspended only
        </label>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!rows ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <Empty>No accounts found.</Empty>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {rows.map((a) => (
            <li
              key={a.subjectType + a.id}
              className="flex flex-wrap items-center gap-3 p-4 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {a.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.subjectType === "company" ? "Company" : "User"} ·{" "}
                  {a.email ?? "no email"} · {a.detail?.replace(/_/g, " ")} ·
                  verification {a.verificationStatus}
                </p>
                {a.suspended && a.suspensionReason && (
                  <p className="text-xs text-destructive">
                    Suspended: {a.suspensionReason}
                  </p>
                )}
              </div>
              {a.suspended && <StatusPill>suspended</StatusPill>}
              <Button
                size="sm"
                variant={a.suspended ? "outline" : "danger"}
                onClick={() => toggle(a)}
              >
                {a.suspended ? "Unsuspend" : "Suspend"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
