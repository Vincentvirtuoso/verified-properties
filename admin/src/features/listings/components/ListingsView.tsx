"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  LuArrowUpRight,
  LuFileText,
  LuMapPin,
  LuRefreshCw,
  LuShieldCheck,
  LuCircleAlert,
  LuImage,
} from "react-icons/lu";
import {
  adminUnpublish,
  fetchAdminListings,
  fetchListingDocuments,
  reviewListing,
  reviewPropertyDocument,
  type AdminListing,
  type ListingDocument,
  type ReviewStatus,
} from "@affilhomes/shared/supabase/admin";
import { Button } from "@affilhomes/shared/ui/Button";
import { formatPrice } from "@affilhomes/shared/utils";
import {
  AskReason,
  Empty,
  FilterChips,
  ReloadButton,
  ReviewActions,
  StatusPill,
} from "@/components/ui/ReviewActions";
import { useAdminList } from "@/hooks/useAdminList";
import { Alert } from "@affilhomes/shared/ui/Alert";
import { DocButton, useOpenDocument } from "./Primitives";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ListingThumb } from "@affilhomes/shared/ui/ListingThumb";

type Filter = ReviewStatus | "live";
type PillTone = "neutral" | "success" | "warning" | "danger";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "pending", label: "Waiting for review" },
  { value: "live", label: "Live" },
  { value: "changes_requested", label: "More info requested" },
  { value: "rejected", label: "Rejected" },
];

const EMPTY_COPY: Record<Filter, { title: string; message: string }> = {
  none: {
    title: "Nothing here yet",
    message: "Listings will appear here once owners submit them for review.",
  },
  pending: {
    title: "Nothing waiting for review",
    message: "New listings will appear here as owners submit them.",
  },
  approved: {
    title: "No approved listings",
    message: "Listings you approve will show up here.",
  },
  live: {
    title: "No live listings",
    message: "Approved listings that are published will show here.",
  },
  changes_requested: {
    title: "No listings awaiting changes",
    message: "Listings sent back to owners appear here until they resubmit.",
  },
  rejected: {
    title: "No rejected listings",
    message: "Rejected listings will be listed here.",
  },
};

const DOC_TONE: Record<string, PillTone> = {
  pending: "warning",
  changes_requested: "warning",
  approved: "success",
  rejected: "danger",
};

const humanize = (value: string) => value.replace(/_/g, " ");

function listingStatus(listing: AdminListing): {
  label: string;
  tone: PillTone;
} {
  if (listing.status === "active") return { label: "Live", tone: "success" };
  switch (listing.reviewStatus) {
    case "pending":
      return { label: "Waiting", tone: "warning" };
    case "changes_requested":
      return { label: "More info requested", tone: "warning" };
    case "rejected":
      return { label: "Rejected", tone: "danger" };
    default:
      return { label: humanize(listing.reviewStatus), tone: "neutral" };
  }
}

function ownerStatus(listing: AdminListing): { label: string; tone: PillTone } {
  if (listing.ownerSuspended)
    return { label: "Owner suspended", tone: "danger" };
  if (listing.ownerVerified)
    return { label: "Owner verified", tone: "success" };
  return { label: "Owner not verified", tone: "warning" };
}

export function ListingsTab() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Partial<Record<Filter, number>>>({});


  const { rows, error, reload, loading } = useAdminList<AdminListing>(
    () =>
      filter === "live"
        ? fetchAdminListings("active", null)
        : fetchAdminListings(null, filter),
    [filter],
  );

   const loadCounts = useCallback(async () => {
     try {
       const [pending, live, changes, rejected] = await Promise.all([
         fetchAdminListings(null, "pending"),
         fetchAdminListings("active", null),
         fetchAdminListings(null, "changes_requested"),
         fetchAdminListings(null, "rejected"),
       ]);
       setCounts({
         pending: pending.length,
         live: live.length,
         changes_requested: changes.length,
         rejected: rejected.length,
       });
     } catch {
     }
   }, []);

   useEffect(() => {
     loadCounts();
   }, [loadCounts]);

     const refresh = useCallback(() => {
       reload();
       loadCounts();
     }, [reload, loadCounts]);

  const changeFilter = (next: Filter) => {
    setOpenId(null);
    setFilter(next);
  };


  const filterOptions = FILTER_OPTIONS.map((o) => ({
    ...o,
    count: counts[o.value],
  }));

  return (
    <section className="space-y-4" aria-label="Listings">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips<Filter>
          label="Listing status"
          value={filter}
          onChange={changeFilter}
          options={filterOptions}
        />
        <div className="flex items-center gap-3 text-xs text-muted">
          {rows && (
            <span className="tabular-nums">
              {rows.length} {rows.length === 1 ? "listing" : "listings"}
            </span>
          )}
          <ReloadButton
            reload={refresh}
            loading={loading}
          />
        </div>
      </div>

      {error && <Alert onRetry={reload}>{error}</Alert>}

      {!rows && !error && (
        <ul
          aria-label="Loading listings"
          aria-busy="true"
          className="space-y-3"
        >
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-border bg-card"
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
          {rows.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              expanded={openId === listing.id}
              onToggle={() =>
                setOpenId((current) =>
                  current === listing.id ? null : listing.id,
                )
              }
              onListingChanged={reload}
              onDone={() => {
                setOpenId(null);
                reload();
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ListingCard({
  listing,
  expanded,
  onToggle,
  onListingChanged,
  onDone,
}: {
  listing: AdminListing;
  expanded: boolean;
  onToggle: () => void;
  onListingChanged: () => void;
  onDone: () => void;
}) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const panelId = `${uid}-panel`;

  const isLive = listing.status === "active";
  const canReview = listing.reviewStatus === "pending";
  const status = listingStatus(listing);
  const owner = ownerStatus(listing);

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
                    href={`/properties/${listing.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {listing.title}
                    <LuArrowUpRight size={14} aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </Link>
                ) : (
                  listing.title
                )}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {listing.ownerName} · {listing.city}, {listing.state}
              </p>
              <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
                {formatPrice(listing.price)}
              </p>
            </div>
          </div>
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={owner.tone}>{owner.label}</StatusPill>
        </div>

        <div className="flex min-w-0 items-start gap-3">
          <ListingThumb
            image={listing.coverImage}
            title={listing.title}
            count={listing.imageCount}
          />
        </div>

        {listing.documentsTotal > 0 && (
          <ApprovalProgress
            approved={listing.documentsApproved}
            total={listing.documentsTotal}
          />
        )}

        {listing.reviewNote && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Note: </span>
            {listing.reviewNote}
          </p>
        )}

        {(isLive || canReview) && (
          <footer className="flex flex-wrap items-start gap-3 border-t border-border pt-4">
            {isLive && (
              <div className="min-w-0 flex-1">
                <AskReason
                  label="Take down"
                  prompt={`Why is "${listing.title}" being taken down?`}
                  placeholder="Explain the reason. The owner will see this."
                  confirmLabel="Take down"
                  destructive
                  suggestions={[
                    "Duplicate of another listing.",
                    "Photos or details are misleading.",
                    "Price or availability is inaccurate.",
                  ]}
                  onConfirm={async (reason) => {
                    await adminUnpublish(listing.id, reason);
                    onDone();
                  }}
                />
              </div>
            )}
            {canReview && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="ml-auto"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={onToggle}
              >
                {expanded ? "Close review" : "Review listing"}
              </Button>
            )}
          </footer>
        )}

        {expanded && canReview && (
          <div id={panelId}>
            <ListingReview
              listing={listing}
              onChanged={onListingChanged}
              onDone={onDone}
            />
          </div>
        )}
      </article>
    </li>
  );
}

function ApprovalProgress({
  approved,
  total,
}: {
  approved: number;
  total: number;
}) {
  const complete = total > 0 && approved >= total;
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Documents</span>
        <span className="tabular-nums">
          {approved}/{total} approved
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Documents approved"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={approved}
        className="h-1.5 overflow-hidden rounded-full bg-border"
      >
        <div
          className={`h-full rounded-full transition-all ${complete ? "bg-success" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ListingReview({
  listing,
  onChanged,
  onDone,
}: {
  listing: AdminListing;
  onChanged: () => void;
  onDone: () => void;
}) {
  const docs = useAdminList<ListingDocument>(
    () => fetchListingDocuments(listing.id),
    [listing.id],
  );
  const files = useOpenDocument("property-documents");
  const unapproved = listing.documentsTotal - listing.documentsApproved;

  return (
    <div className="space-y-5 border-t border-border pt-4">
      {files.error && <Alert onDismiss={files.clearError}>{files.error}</Alert>}
      {docs.error && <Alert onRetry={docs.reload}>{docs.error}</Alert>}

      <section aria-labelledby={`${listing.id}-docs`} className="space-y-2">
        <SectionLabel icon={LuFileText} id={`${listing.id}-docs`}>
          Property documents
        </SectionLabel>

        {!docs.rows && !docs.error && (
          <p className="text-xs text-muted-foreground">Loading documents…</p>
        )}
        {docs.rows?.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No documents uploaded yet.
          </p>
        )}
        {docs.rows?.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            openingPath={files.openingPath}
            onOpen={files.open}
            onChanged={() => {
              docs.reload();
              onChanged();
            }}
          />
        ))}
      </section>

      <section
        aria-labelledby={`${listing.id}-decision`}
        className="space-y-3 border-t border-border pt-4"
      >
        <SectionLabel icon={LuShieldCheck} id={`${listing.id}-decision`}>
          Listing decision
        </SectionLabel>

        {unapproved > 0 && (
          <p className="flex items-start gap-1.5 text-xs text-warning">
            <LuCircleAlert
              size={13}
              aria-hidden="true"
              className="mt-px shrink-0"
            />
            {unapproved}{" "}
            {unapproved === 1 ? "document isn't" : "documents aren't"} approved
            yet.
          </p>
        )}

        <ReviewActions
          labels={{
            approve: "Approve & publish",
            more_info: "Request changes",
            reject: "Reject listing",
          }}
          onDecide={async (decision, reason) => {
            await reviewListing(listing.id, decision, reason);
            onDone();
          }}
        />
      </section>
    </div>
  );
}

function DocumentRow({
  doc,
  openingPath,
  onOpen,
  onChanged,
}: {
  doc: ListingDocument;
  openingPath: string | null;
  onOpen: (path: string) => Promise<void>;
  onChanged: () => void;
}) {
  const label = doc.title || humanize(doc.documentType);
  const subtitle = doc.title ? humanize(doc.documentType) : null;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <DocButton
            label={label}
            busy={openingPath === doc.fileUrl}
            onClick={() => onOpen(doc.fileUrl)}
          />
          {subtitle && (
            <p className="mt-1 text-[11px] capitalize text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        <StatusPill tone={DOC_TONE[doc.reviewStatus] ?? "neutral"}>
          {humanize(doc.reviewStatus)}
        </StatusPill>
      </div>

      {doc.reviewNote && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Note: </span>
          {doc.reviewNote}
        </p>
      )}

      {doc.reviewStatus !== "approved" && (
        <ReviewActions
          onDecide={async (decision, reason) => {
            await reviewPropertyDocument(doc.id, decision, reason);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

