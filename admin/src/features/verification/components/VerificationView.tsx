"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  LuBuilding2,
  LuCircleAlert,
  LuExternalLink,
  LuFileText,
  LuIdCard,
  LuMail,
  LuPhone,
  LuRefreshCw,
  LuShieldCheck,
  LuUser,
} from "react-icons/lu";
import {
  documentLink,
  fetchIdentityDocuments,
  fetchVerificationQueue,
  reviewIdentityDocument,
  setVerification,
  type IdentityDocumentItem,
  type VerificationItem,
  type VerificationStatus,
} from "@affilhomes/shared/supabase/admin";
import { ID_DOC_LABEL, type IdDocType } from "@affilhomes/shared/supabase";
import { Button, Skeleton } from "@affilhomes/shared/ui";
import {
  Empty,
  FilterChips,
  ReviewActions,
  StatusPill,
  type ReviewDecision,
} from "../../../components/ui/ReviewActions";
import { useAdminList } from "../../../hooks/useAdminList";

type Bucket = "company-documents" | "identity-documents";
type Tone = "neutral" | "success" | "warning" | "danger";
type OpenDocument = (path: string, bucket: Bucket) => Promise<void>;

const DOC_LABELS: Record<string, string> = {
  cacCertificateUrl: "CAC certificate",
  companyLogoUrl: "Logo",
};

const STATUS_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "unverified", label: "More info requested" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const EMPTY_COPY: Record<
  VerificationStatus,
  { title: string; message: string }
> = {
  pending: {
    title: "Nothing waiting",
    message: "New verification requests will show up here.",
  },
  unverified: {
    title: "No requests awaiting a reply",
    message:
      "Requests sent back for more info appear here until the user responds.",
  },
  verified: {
    title: "No verified accounts yet",
    message: "Approved requests will be listed here.",
  },
  rejected: {
    title: "No rejections",
    message: "Rejected requests will be listed here.",
  },
};

const ID_STATUS_TONE: Record<string, Tone> = {
  pending: "warning",
  approved: "success",
  verified: "success",
  rejected: "danger",
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export function VerificationView() {
  const [status, setStatus] = useState<VerificationStatus>("pending");
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  const queue = useAdminList<VerificationItem>(
    () => fetchVerificationQueue(status),
    [status],
  );
  const ids = useAdminList<IdentityDocumentItem>(
    () => fetchIdentityDocuments(null),
    [],
  );

  const { idsByUser, looseIds } = useMemo(() => {
    const byUser = new Map<string, IdentityDocumentItem[]>();
    for (const d of ids.rows ?? []) {
      const list = byUser.get(d.userId);
      if (list) list.push(d);
      else byUser.set(d.userId, [d]);
    }
    const queued = new Set((queue.rows ?? []).map((q) => q.subjectId));
    const loose = (ids.rows ?? []).filter(
      (d) => d.status === "pending" && !queued.has(d.userId),
    );
    return { idsByUser: byUser, looseIds: loose };
  }, [ids.rows, queue.rows]);

  const openDocument: OpenDocument = async (path, bucket) => {
    setDocError(null);
    setOpeningPath(path);
    const win = window.open("about:blank", "_blank");
    if (!win) {
      setDocError(
        "Your browser blocked the document. Allow pop-ups for this site and try again.",
      );
      setOpeningPath(null);
      return;
    }
    win.opener = null;
    try {
      win.location.href = await documentLink(path, bucket);
    } catch {
      win.close();
      setDocError("Couldn't open that document. Try again in a moment.");
    } finally {
      setOpeningPath(null);
    }
  };

  const decide = async (
    item: VerificationItem,
    decision: ReviewDecision,
    reason: string,
  ) => {
    await setVerification(item, decision, reason);
    queue.reload();
  };

  const count = queue.rows?.length;
  const idsLoading = !ids.rows && !ids.error;

  return (
    <section className="space-y-4" aria-label="Verification queue">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips<VerificationStatus>
          label="Verification status"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {count !== undefined && (
            <span className="tabular-nums">
              {count} {count === 1 ? "request" : "requests"}
            </span>
          )}
          <Button
            type="button"
            onClick={() => {
              queue.reload();
              ids.reload();
            }}
            variant="ghost"
            size="xs"
            leftIcon={<LuRefreshCw aria-hidden="true" />}
            isLoading={queue.loading || ids.loading}
            loadingText="Refreshing..."
          >
            Refresh
          </Button>
        </div>
      </div>

      {docError && (
        <Alert onDismiss={() => setDocError(null)}>{docError}</Alert>
      )}

      {queue.error && <Alert onRetry={queue.reload}>{queue.error}</Alert>}

      {!queue.rows && !queue.error && <VerificationCardsSkeleton />}

      {queue.rows && queue.rows.length === 0 && (
        <Empty
          title={EMPTY_COPY[status].title}
          message={EMPTY_COPY[status].message}
        />
      )}

      {queue.rows && queue.rows.length > 0 && (
        <ul className="space-y-3">
          {queue.rows.map((item) => (
            <VerificationCard
              key={`${item.subjectType}-${item.subjectId}`}
              item={item}
              showDecision={status === "pending"}
              idDocs={
                item.subjectType === "agent"
                  ? (idsByUser.get(item.subjectId) ?? [])
                  : []
              }
              idDocsLoading={idsLoading}
              onDecide={(decision, reason) => decide(item, decision, reason)}
              onIdChanged={ids.reload}
              onOpen={openDocument}
              openingPath={openingPath}
            />
          ))}
        </ul>
      )}

      {status === "pending" && queue.rows && idsLoading && <LooseIdsSkeleton />}

      {status === "pending" && ids.rows && looseIds.length > 0 && (
        <section aria-labelledby="loose-ids-heading" className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <LuIdCard
              size={16}
              aria-hidden="true"
              className="text-muted-foreground"
            />
            <h2
              id="loose-ids-heading"
              className="text-sm font-semibold text-foreground"
            >
              ID cards waiting for a request
            </h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {looseIds.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            These users uploaded an ID but haven&apos;t submitted a verification
            request yet.
          </p>
          {looseIds.map((d) => (
            <div
              key={d.id}
              className="space-y-2 rounded-2xl border border-border bg-card p-4"
            >
              <p className="text-sm font-medium text-foreground">
                {d.userName}
              </p>
              <IdDocRow
                doc={d}
                onOpen={openDocument}
                openingPath={openingPath}
                onChanged={ids.reload}
              />
            </div>
          ))}
        </section>
      )}
    </section>
  );
}

function VerificationCard({
  item,
  showDecision,
  idDocs,
  idDocsLoading,
  onDecide,
  onIdChanged,
  onOpen,
  openingPath,
}: {
  item: VerificationItem;
  showDecision: boolean;
  idDocs: IdentityDocumentItem[];
  idDocsLoading: boolean;
  onDecide: (decision: ReviewDecision, reason: string) => Promise<void>;
  onIdChanged: () => void;
  onOpen: OpenDocument;
  openingPath: string | null;
}) {
  const isAgent = item.subjectType === "agent";
  const SubjectIcon = isAgent ? LuUser : LuBuilding2;
  const detail = item.detail?.replace(/_/g, " ");
  const companyDocs = Object.entries(item.documents).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1] !== "",
  );

  return (
    <li className="space-y-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-sm sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary"
          >
            {initials(item.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {item.name}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 capitalize">
                <SubjectIcon size={12} aria-hidden="true" />
                {item.subjectType}
              </span>
              {detail && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{detail}</span>
                </>
              )}
            </p>
            {(item.email || item.phone) && (
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {item.email && (
                  <a
                    href={`mailto:${item.email}`}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <LuMail size={12} aria-hidden="true" />
                    {item.email}
                  </a>
                )}
                {item.phone && (
                  <a
                    href={`tel:${item.phone}`}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <LuPhone size={12} aria-hidden="true" />
                    {item.phone}
                  </a>
                )}
              </p>
            )}
          </div>
        </div>
        <time
          dateTime={item.createdAt}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {formatDate(item.createdAt)}
        </time>
      </header>

      {!isAgent && (
        <div className="space-y-2">
          <SectionLabel icon={LuFileText}>Company documents</SectionLabel>
          {companyDocs.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No CAC documents uploaded yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {companyDocs.map(([key, path]) => (
                <DocButton
                  key={key}
                  label={DOC_LABELS[key] ?? key}
                  busy={openingPath === path}
                  onClick={() => onOpen(path, "company-documents")}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isAgent && (
        <div className="space-y-2">
          <SectionLabel icon={LuIdCard}>Government ID</SectionLabel>
          {idDocsLoading ? (
            <Skeleton className="h-18.5 rounded-xl" />
          ) : idDocs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No ID uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {idDocs.map((d) => (
                <IdDocRow
                  key={d.id}
                  doc={d}
                  onOpen={onOpen}
                  openingPath={openingPath}
                  onChanged={onIdChanged}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showDecision && (
        <div className="space-y-2 border-t border-border pt-4">
          <SectionLabel icon={LuShieldCheck}>
            {isAgent ? "Agent decision" : "Company decision"}
          </SectionLabel>
          <ReviewActions onDecide={onDecide} />
        </div>
      )}
    </li>
  );
}

function IdDocRow({
  doc,
  onOpen,
  openingPath,
  onChanged,
}: {
  doc: IdentityDocumentItem;
  onOpen: OpenDocument;
  openingPath: string | null;
  onChanged: () => void;
}) {
  const label = ID_DOC_LABEL[doc.docType as IdDocType] ?? doc.docType;
  const tone = ID_STATUS_TONE[doc.status] ?? "neutral";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DocButton
          label={label}
          busy={openingPath === doc.filePath}
          onClick={() => onOpen(doc.filePath, "identity-documents")}
        />
        <StatusPill tone={tone}>{doc.status.replace(/_/g, " ")}</StatusPill>
      </div>

      {doc.reviewNote && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Note: </span>
          {doc.reviewNote}
        </p>
      )}

      {doc.status === "pending" && (
        <ReviewActions
          onDecide={async (decision, reason) => {
            await reviewIdentityDocument(doc.id, decision, reason);

            onChanged();
          }}
        />
      )}
    </div>
  );
}

function DocButton({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {busy ? (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        <LuFileText
          size={14}
          aria-hidden="true"
          className="text-muted-foreground"
        />
      )}
      {busy ? "Opening…" : label}
      {!busy && (
        <LuExternalLink
          size={12}
          aria-hidden="true"
          className="text-muted-foreground"
        />
      )}
    </button>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: IconType;
  children: ReactNode;
}) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon size={12} aria-hidden="true" />
      {children}
    </p>
  );
}

function Alert({
  children,
  onRetry,
  onDismiss,
}: {
  children: ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <span className="flex items-start gap-2">
        <LuCircleAlert
          size={16}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        {children}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md px-2 py-1 text-xs font-medium underline underline-offset-2 hover:bg-destructive/10"
        >
          Try again
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2 py-1 text-xs font-medium underline underline-offset-2 hover:bg-destructive/10"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Skeletons
 * -------------------------------------------------------------------------- */

function VerificationCardsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <ul
      aria-label="Loading verification requests"
      aria-busy="true"
      className="space-y-3"
    >
      <span className="sr-only">Loading requests…</span>
      {Array.from({ length: count }).map((_, i) => (
        <VerificationCardSkeleton key={i} />
      ))}
    </ul>
  );
}

function VerificationCardSkeleton() {
  return (
    <li className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-52" />
          </div>
        </div>
        <Skeleton className="h-3 w-16" />
      </div>

      {/* documents */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* decision area */}
      <div className="space-y-2 border-t border-border pt-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </li>
  );
}

function LooseIdsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <section aria-busy="true" className="space-y-3 pt-2">
      <span className="sr-only">Loading ID cards…</span>

      <div className="flex items-center gap-2">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full max-w-sm" />

      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 rounded-2xl border border-border bg-card p-4"
        >
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
