"use client";

import { useState } from "react";
import Link from "next/link";
import {
  adminUnpublish,
  documentLink,
  errorText,
  fetchAdminListings,
  fetchListingDocuments,
  reviewListing,
  reviewPropertyDocument,
  type AdminListing,
  type ListingDocument,
  type ReviewStatus,
} from "@affilhomes/shared/supabase/admin";
import { formatPrice } from "@/lib/formatters";
import { Button } from "@affilhomes/shared/ui/Button";
import {
  askReason,
  Empty,
  FilterChips,
  ReviewActions,
  StatusPill,
} from "./ReviewActions";
import { useAdminList } from "./useAdminList";

type Filter = ReviewStatus | "live";

export function ListingsTab() {
  const [filter, setFilter] = useState<Filter>("pending");
  const { rows, error, reload } = useAdminList<AdminListing>(
    () =>
      filter === "live"
        ? fetchAdminListings("active", null)
        : fetchAdminListings(null, filter),
    [filter],
  );
  const [open, setOpen] = useState<string | null>(null);

  const takeDown = async (r: AdminListing) => {
    const reason = askReason(`Take "${r.title}" off the site?`);
    if (!reason) return;
    try {
      await adminUnpublish(r.id, reason);
      reload();
    } catch (e) {
      window.alert(errorText(e, "Couldn't take that listing down."));
    }
  };

  return (
    <section className="space-y-4">
      <FilterChips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "pending", label: "Waiting for review" },
          { value: "live", label: "Live" },
          { value: "changes_requested", label: "More info requested" },
          { value: "rejected", label: "Rejected" },
        ]}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!rows ? (
        <p className="text-sm text-muted-foreground">Loadingâ€¦</p>
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {r.status === "active" ? (
                      <Link
                        href={`/properties/${r.slug}`}
                        className="hover:underline"
                        target="_blank"
                      >
                        {r.title}
                      </Link>
                    ) : (
                      r.title
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.ownerName} Â· {r.city}, {r.state} Â· {formatPrice(r.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Owner{" "}
                    {r.ownerSuspended
                      ? "suspended"
                      : r.ownerVerified
                        ? "verified"
                        : "not verified"}{" "}
                    Â· Documents {r.documentsApproved}/{r.documentsTotal}{" "}
                    approved
                  </p>
                  {r.reviewNote && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Note: {r.reviewNote}
                    </p>
                  )}
                </div>
                <StatusPill>
                  {r.status === "active"
                    ? "live"
                    : r.reviewStatus.replace("_", " ")}
                </StatusPill>
                {r.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => takeDown(r)}
                  >
                    Take down
                  </Button>
                )}
                {r.reviewStatus === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpen(open === r.id ? null : r.id)}
                  >
                    {open === r.id ? "Close" : "Review"}
                  </Button>
                )}
              </div>
              {open === r.id && r.reviewStatus === "pending" && (
                <ListingReview
                  listing={r}
                  onDone={() => {
                    setOpen(null);
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

function ListingReview({
  listing,
  onDone,
}: {
  listing: AdminListing;
  onDone: () => void;
}) {
  const docs = useAdminList<ListingDocument>(
    () => fetchListingDocuments(listing.id),
    [listing.id],
  );

  const open = async (path: string) => {
    try {
      window.open(
        await documentLink(path, "property-documents"),
        "_blank",
        "noopener",
      );
    } catch {
      window.alert("Couldn't open that document.");
    }
  };

  return (
    <div className="space-y-4 border-t border-border pt-3">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Property documents
        </p>
        {!docs.rows ? (
          <p className="text-xs text-muted-foreground">Loadingâ€¦</p>
        ) : docs.rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No documents uploaded.
          </p>
        ) : (
          docs.rows.map((d) => (
            <div
              key={d.id}
              className="space-y-2 rounded-xl border border-border p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => open(d.fileUrl)}
                  className="font-medium text-primary hover:underline"
                >
                  {d.documentType.replace(/_/g, " ")}{" "}
                  {d.title ? `Â· ${d.title}` : ""}
                </button>
                <StatusPill>{d.reviewStatus.replace("_", " ")}</StatusPill>
                {d.reviewNote && (
                  <span className="text-xs text-muted-foreground">
                    {d.reviewNote}
                  </span>
                )}
              </div>
              {d.reviewStatus !== "approved" && (
                <ReviewActions
                  onDecide={async (dec, reason) => {
                    await reviewPropertyDocument(d.id, dec, reason);
                    docs.reload();
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Listing decision
        </p>
        <ReviewActions
          labels={{
            approve: "Approve & publish",
            more_info: "Request changes",
          }}
          onDecide={async (dec, reason) => {
            await reviewListing(listing.id, dec, reason);
            onDone();
          }}
        />
      </div>
    </div>
  );
}
