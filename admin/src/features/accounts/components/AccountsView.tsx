"use client";

import { useId, useState, type FormEvent } from "react";
import {
  LuBuilding2,
  LuInfo,
  LuLayoutGrid,
  LuRefreshCw,
  LuSearch,
  LuTable,
  LuUser,
} from "react-icons/lu";
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
import { DataTable, DataTableColumn } from "@affilhomes/shared/ui/DataTable";

type Filter = "all" | "suspended";
type View = "cards" | "table";
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
const getAccountId = (a: AdminAccount) => `${a.subjectType}-${a.id}`;

export function AccountsTab() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("cards");
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

  const columns: DataTableColumn<AdminAccount>[] = [
    {
      id: "account",
      header: "Account",
      sortable: true,
      accessor: (a) => a.name,
      cell: (a) => {
        const isCompany = a.subjectType === "company";
        const Icon = isCompany ? LuBuilding2 : LuUser;
        return (
          <div className="flex items-start gap-2.5">
            <div
              aria-hidden="true"
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${
                a.suspended
                  ? "border-destructive/15 bg-destructive/5 text-destructive"
                  : "border-border bg-muted/30 text-muted"
              }`}
            >
              <Icon size={16} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {a.name}
              </p>
              <p className="truncate text-xs text-muted">
                {a.email ?? "No email on file"}
              </p>
              <p className="truncate text-xs text-muted">
                {isCompany ? "Company" : "Individual"}
                {a.adminRole
                  ? ` · ${a.adminRole}`
                  : a.detail
                    ? ` · ${humanize(a.detail)}`
                    : ""}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "verification",
      header: "Verification",
      sortable: true,
      accessor: (a) => {
        if (a.adminRole) return "verified";
        if (a.verificationStatus === "-") return "";
        return a.verificationStatus;
      },
      cell: (a) => {
        const v = VERIFICATION[a.verificationStatus] ?? {
          label: humanize(a.verificationStatus),
          tone: "neutral" as Tone,
        };
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {a.adminRole && <StatusPill tone="neutral">Admin</StatusPill>}
            {v.label !== "-" && (
              <StatusPill tone={v.tone}>{v.label}</StatusPill>
            )}
            {!a.adminRole && v.label === "-" && (
              <span className="text-xs text-muted">
                Not applicable<span className="sr-only"> (verification)</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      accessor: (a) => (a.suspended ? "suspended" : "active"),
      cell: (a) =>
        a.suspended ? (
          <StatusPill tone="danger">Suspended</StatusPill>
        ) : (
          <StatusPill tone="success">Active</StatusPill>
        ),
    },
    {
      id: "reason",
      header: "Suspension reason",
      hideable: true,
      accessor: (a) => a.suspensionReason ?? "",
      cell: (a) =>
        a.suspensionReason ? (
          <span className="line-clamp-2 max-w-xs whitespace-pre-wrap text-xs text-foreground/80">
            {a.suspensionReason}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "actions",
      header: "Action",
      align: "right",
      hideable: false,
      cell: (a) => <AccountActionCell account={a} onChanged={reload} />,
    },
  ];

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
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
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

        <div className="flex items-center gap-3 text-xs text-muted">
          <ViewToggle value={view} onChange={setView} />
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

      {view === "cards" && error && <Alert onRetry={reload}>{error}</Alert>}

      {view === "table" ? (
        <DataTable<AdminAccount>
          data={rows ?? []}
          columns={columns}
          getRowId={getAccountId}
          loading={!rows && !error}
          error={error}
          onRetry={reload}
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
          initialHiddenColumns={["reason"]}
          emptyTitle={emptyCopy.title}
          emptyDescription={emptyCopy.message}
        />
      ) : (
        <>
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
                  key={getAccountId(account)}
                  account={account}
                  onChanged={reload}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: View;
  onChange: (value: View) => void;
}) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex rounded-lg border border-border bg-background p-0.5"
    >
      <button
        type="button"
        onClick={() => onChange("cards")}
        aria-pressed={value === "cards"}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          value === "cards"
            ? "bg-muted/30 text-foreground"
            : "text-muted hover:text-foreground"
        }`}
      >
        <LuLayoutGrid size={14} aria-hidden="true" />
        Cards
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        aria-pressed={value === "table"}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          value === "table"
            ? "bg-muted/30 text-foreground"
            : "text-muted hover:text-foreground"
        }`}
      >
        <LuTable size={14} aria-hidden="true" />
        Table
      </button>
    </div>
  );
}

function AccountActionCell({
  account: a,
  onChanged,
}: {
  account: AdminAccount;
  onChanged: () => void;
}) {
  const isSuspended = a.suspended;
  return (
    <AskReason
      variant="modal"
      label={isSuspended ? "Lift suspension" : "Suspend account"}
      prompt={
        isSuspended
          ? `Why is the suspension on ${a.name} being lifted?`
          : `Why is ${a.name} being suspended?`
      }
      placeholder={
        isSuspended
          ? "Explain why the suspension is being lifted."
          : "Describe the reason for suspending this account."
      }
      confirmLabel={isSuspended ? "Lift suspension" : "Suspend account"}
      destructive={!isSuspended}
      suggestions={isSuspended ? UNSUSPEND_SUGGESTIONS : SUSPEND_SUGGESTIONS}
      onConfirm={async (reason) => {
        if (isSuspended) {
          await unsuspendAccount(a.subjectType, a.id, reason);
        } else {
          await suspendAccount(a.subjectType, a.id, reason);
        }
        onChanged();
      }}
    />
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

  const isSuspended = a.suspended;
  const actionLabel = isSuspended ? "Lift suspension" : "Suspend account";

  return (
    <li
      className={`
        group relative overflow-hidden rounded-2xl border bg-card
        transition-colors duration-200
        ${
          isSuspended
            ? "border-destructive/30"
            : "border-border hover:border-border/80"
        }
      `}
    >
      {isSuspended && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1 bg-destructive/70"
        />
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className={`
              flex size-11 shrink-0 items-center justify-center rounded-xl
              border
              ${
                isSuspended
                  ? "border-destructive/15 bg-destructive/5 text-destructive"
                  : "border-border bg-muted/30 text-muted"
              }
            `}
            aria-hidden="true"
          >
            <SubjectIcon size={20} strokeWidth={1.8} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                title={a.name}
                className="min-w-0 wrap-break-word text-sm font-semibold leading-5 text-foreground sm:text-base"
              >
                {a.name}
              </h3>

              {isSuspended && <StatusPill tone="danger">Suspended</StatusPill>}
            </div>

            <p className="mt-1 text-xs text-muted">
              {isCompany ? "Company account" : "Individual account"}
              {a.adminRole
                ? ` · ${a.adminRole}`
                : a.detail
                  ? ` · ${humanize(a.detail)}`
                  : ""}
            </p>

            <p
              title={a.email ?? undefined}
              className="mt-1 break-all text-sm text-muted"
            >
              {a.email ?? "No email on file"}
            </p>
          </div>
        </div>

        {verification.label !== "-" && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
            <span className="text-xs text-muted">Verification</span>
            <StatusPill tone={verification.tone}>
              {verification.label}
            </StatusPill>
          </div>
        )}

        {isSuspended && a.suspensionReason && (
          <div className="mt-4 rounded-xl border border-destructive/15 bg-destructive/5 p-3">
            <p className="text-xs font-semibold text-destructive">
              Suspension reason
            </p>
            <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-foreground/80">
              {a.suspensionReason}
            </p>
          </div>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-start gap-2">
            <LuInfo
              size={16}
              className="mt-0.5 shrink-0 text-muted"
              aria-hidden="true"
            />

            <p className="text-xs leading-relaxed text-muted">
              {isSuspended
                ? "Lifting the suspension does not republish listings. The owner must resubmit them for review."
                : "Suspending this account hides its live listings and prevents the owner from publishing."}
            </p>
          </div>

          <div className="mt-4">
            <AskReason
              label={actionLabel}
              prompt={
                isSuspended
                  ? `Why is the suspension on ${a.name} being lifted?`
                  : `Why is ${a.name} being suspended?`
              }
              placeholder={
                isSuspended
                  ? "Explain why the suspension is being lifted."
                  : "Describe the reason for suspending this account."
              }
              confirmLabel={isSuspended ? "Lift suspension" : "Suspend account"}
              destructive={!isSuspended}
              suggestions={
                isSuspended ? UNSUSPEND_SUGGESTIONS : SUSPEND_SUGGESTIONS
              }
              onConfirm={async (reason) => {
                if (isSuspended) {
                  await unsuspendAccount(a.subjectType, a.id, reason);
                } else {
                  await suspendAccount(a.subjectType, a.id, reason);
                }

                onChanged();
              }}
            />
          </div>
        </div>
      </div>
    </li>
  );
}
