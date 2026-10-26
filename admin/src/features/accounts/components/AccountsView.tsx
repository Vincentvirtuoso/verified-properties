"use client";

import { useId, useState, type FormEvent } from "react";
import { LuBuilding2, LuRefreshCw, LuSearch, LuUser } from "react-icons/lu";
import {
  searchAccounts,
  suspendAccount,
  unsuspendAccount,
  type AdminAccount,
} from "@affilhomes/shared/supabase/admin";
import { Button } from "@affilhomes/shared/ui/Button";
import {
  AskReason,
  Empty,
  FilterChips,
  StatusPill,
} from "@/components/ui/ReviewActions";
import { useAdminList } from "@/hooks/useAdminList";
import { Alert } from "@affilhomes/shared/ui/Alert";

type Filter = "all" | "suspended";
type Tone = "neutral" | "success" | "warning" | "danger";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "All accounts" },
  { value: "suspended", label: "Suspended" },
];

const VERIFICATION: Record<string, { label: string; tone: Tone }> = {
  verified: { label: "Verified", tone: "success" },
  pending: { label: "Verification pending", tone: "warning" },
  rejected: { label: "Verification rejected", tone: "danger" },
  unverified: { label: "Not verified", tone: "neutral" },
};

const SUSPEND_SUGGESTIONS = [
  "Repeated policy violations.",
  "Fraudulent or misleading activity.",
  "Under investigation.",
];

const UNSUSPEND_SUGGESTIONS = [
  "Issue resolved.",
  "Appeal accepted.",
  "Suspended in error.",
];

const humanize = (value: string) => value.replace(/_/g, " ");

export function AccountsTab() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const searchId = useId();

  const { rows, error, reload } = useAdminList<AdminAccount>(
    () => searchAccounts(query, filter === "suspended"),
    [query, filter],
  );

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQuery(input.trim());
  };

  const emptyCopy = query
    ? {
        title: "No accounts match your search",
        message: `Nothing matches "${query}". Check the spelling or try the email address.`,
      }
    : filter === "suspended"
      ? {
          title: "No suspended accounts",
          message: "Suspended users and companies will appear here.",
        }
      : {
          title: "No accounts yet",
          message: "Users and companies will appear here once they sign up.",
        };

  return (
    <section className="space-y-4" aria-label="Accounts">
      <form
        role="search"
        onSubmit={submitSearch}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative min-w-0 flex-1">
          <LuSearch
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <label htmlFor={searchId} className="sr-only">
            Search accounts by name or email
          </label>
          <input
            id={searchId}
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search name or email"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips<Filter>
          label="Account status"
          value={filter}
          onChange={setFilter}
          options={FILTER_OPTIONS}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {rows && (
            <span className="tabular-nums">
              {rows.length} {rows.length === 1 ? "account" : "accounts"}
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
        <ul
          aria-label="Loading accounts"
          aria-busy="true"
          className="space-y-3"
        >
          {[0, 1, 2].map((i) => (
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
          {rows.map((account) => (
            <AccountCard
              key={`${account.subjectType}-${account.id}`}
              account={account}
              onChanged={reload}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function AccountCard({
  account: a,
  onChanged,
}: {
  account: AdminAccount;
  onChanged: () => void;
}) {
  const isCompany = a.subjectType === "company";
  const SubjectIcon = isCompany ? LuBuilding2 : LuUser;
  const verification = VERIFICATION[a.verificationStatus] ?? {
    label: humanize(a.verificationStatus),
    tone: "neutral" as Tone,
  };

  return (
    <li
      className={`rounded-2xl border bg-card p-4 transition-shadow hover:shadow-sm sm:p-5 ${
        a.suspended ? "border-destructive/30" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/30 text-muted"
          >
            <SubjectIcon size={18} />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground">{a.name}</p>
              {a.suspended && <StatusPill tone="danger">Suspended</StatusPill>}
            </div>
            <p className="text-xs capitalize text-muted-foreground">
              {isCompany ? "Company" : "User"}
              {a.adminRole
                ? a.adminRole
                : a.detail
                  ? ` · ${humanize(a.detail)}`
                  : null }
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {a.email ?? "No email on file"}
            </p>
            {verification.label !== "-" && (
              <div className="pt-1">
                <StatusPill tone={verification.tone}>
                  {verification.label}
                </StatusPill>
              </div>
            )}
            {a.suspended && a.suspensionReason && (
              <p className="pt-1 text-xs text-destructive">
                <span className="font-medium">Reason: </span>
                {a.suspensionReason}
              </p>
            )}
          </div>
        </div>
      </div>
  
      <footer className="mt-4 space-y-2 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {a.suspended
            ? "Lifting the suspension does not republish listings. Owners must resubmit them for review."
            : "Suspending hides all of this account's live listings and blocks publishing."}
        </p>
        <div className="sm:max-w-md">
          <AskReason
            label={a.suspended ? "Lift suspension" : "Suspend account"}
            prompt={
              a.suspended
                ? `Why is the suspension on ${a.name} being lifted?`
                : `Why is ${a.name} being suspended?`
            }
            placeholder={
              a.suspended
                ? "Explain why the suspension is being lifted."
                : "Explain the reason for this suspension."
            }
            confirmLabel={a.suspended ? "Lift suspension" : "Suspend"}
            destructive={!a.suspended}
            suggestions={
              a.suspended ? UNSUSPEND_SUGGESTIONS : SUSPEND_SUGGESTIONS
            }
            onConfirm={async (reason) => {
              if (a.suspended) {
                await unsuspendAccount(a.subjectType, a.id, reason);
              } else {
                await suspendAccount(a.subjectType, a.id, reason);
              }
              onChanged();
            }}
          />
        </div>
      </footer>
    </li>
  );
}
