"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { PopulatedProperty } from "@affilhomes/shared/types";
import { errorText } from "@affilhomes/shared/supabase/admin";
import {
  deleteMyVideo,
  uploadListingVideo,
  type AppealSubject,
  type MyAppeal,
  type MyVideo,
} from "@affilhomes/shared/supabase";
import { formatPrice } from "@/lib/formatters";
import { Button } from "@affilhomes/shared/ui/Button";
import { ListingThumb } from "@affilhomes/shared/ui/ListingThumb";
import { AppealRow } from "@/components/common/AppealRow";
import { useConfirm } from "@/contexts/ConfirmDialog";

export type StateKey =
  | "live"
  | "pending"
  | "attention"
  | "hidden"
  | "draft"
  | "closed";

export type Bucket = "all" | StateKey;

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Live",
  inactive: "Hidden",
  sold: "Sold",
  rented: "Rented",
};

const VIDEO_LABEL: Record<string, string> = {
  pending: "Video waiting for review",
  approved: "Video approved",
  rejected: "Video rejected",
  changes_requested: "Video changes requested",
};

const BADGE_STYLE: Record<StateKey, string> = {
  live: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  attention: "bg-destructive/10 text-destructive",
  hidden: "bg-muted/40 text-muted",
  draft: "bg-muted/40 text-muted",
  closed: "bg-muted/40 text-muted",
};

const ACCENT_STYLE: Record<StateKey, string> = {
  live: "border-l-emerald-500",
  pending: "border-l-amber-500",
  attention: "border-l-destructive",
  hidden: "border-l-border",
  draft: "border-l-border",
  closed: "border-l-border",
};

export function getRejectedDocs(p: PopulatedProperty) {
  return (p.documents ?? []).filter(
    (d) => d.reviewStatus === "rejected" || d.reviewStatus === "more_info",
  );
}

export function getBucket(p: PopulatedProperty): StateKey {
  const review = p.reviewStatus ?? "none";
  if (
    review === "rejected" ||
    review === "changes_requested" ||
    getRejectedDocs(p).length > 0
  )
    return "attention";
  if (review === "pending") return "pending";
  if (p.status === "active") return "live";
  if (p.status === "inactive") return "hidden";
  if (p.status === "sold" || p.status === "rented") return "closed";
  return "draft";
}

export function getBadgeLabel(p: PopulatedProperty): string {
  const review = p.reviewStatus ?? "none";
  if (review === "pending") return "Waiting for review";
  if (review === "rejected") return "Rejected";
  if (review === "changes_requested") return "Changes requested";
  return STATUS_LABEL[p.status] ?? p.status;
}

interface MyListingsCardProps {
  listing: PopulatedProperty;
  bucket: StateKey;
  videos?: MyVideo[];
  canPublish: boolean;
  isBusy: boolean;
  userId: string;
  disabled: boolean;
  isOwner?: boolean;
  ownerName?: string;
  enquiries?: number;
  openAppeal?: (type: AppealSubject, id: string) => MyAppeal | undefined;
  onToggle: () => void;
  onAppeal?: (type: AppealSubject, id: string) => void;
  onReload?: () => void;
}

export function MyListingsCard({
  listing: p,
  bucket,
  videos,
  canPublish,
  isBusy,
  userId,
  disabled,
  isOwner = true,
  ownerName,
  enquiries,
  openAppeal,
  onToggle,
  onAppeal,
  onReload,
}: MyListingsCardProps) {
  const review = p.reviewStatus ?? "none";
  const rejectedDocs = getRejectedDocs(p);
  const canToggle =
    isOwner &&
    (p.status === "draft" ||
      p.status === "inactive" ||
      p.status === "active") &&
    review !== "pending";
  const needsAttention = bucket === "attention";

  return (
    <li
      className={`space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm ${ACCENT_STYLE[bucket]}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">
            {p.status === "active" ? (
              <Link href={`/properties/${p.slug}`} className="hover:underline">
                {p.title}
              </Link>
            ) : (
              p.title
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {p.location?.city} ·{" "}
            {formatPrice(p.price, { currency: p.currency })}
            {ownerName && <> · by {ownerName}</>}
            {enquiries !== undefined && (
              <>
                {" "}
                · {enquiries} enquir{enquiries === 1 ? "y" : "ies"}
              </>
            )}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_STYLE[bucket]}`}
        >
          {getBadgeLabel(p)}
        </span>
      </div>

      {p.image && (
        <ListingThumb
          image={{ url: p.image, alt: p.title }}
          title={p.title}
          count={p.gallery ? p.gallery.length : 1}
        />
      )}

      {bucket === "pending" && (
        <p className="text-sm text-muted">
          Our team is reviewing this listing.
        </p>
      )}

      {p.reviewNote && review !== "approved" && (
        <p className="text-sm text-muted">Note from our team: {p.reviewNote}</p>
      )}

      {needsAttention && (
        <div className="space-y-3 rounded-xl bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">
            {review === "changes_requested"
              ? "Changes requested"
              : review === "rejected"
                ? "This listing was rejected"
                : "Some documents need attention"}
          </p>
          {rejectedDocs.map((d) => (
            <div key={d.id} className="space-y-2">
              <p className="text-muted">
                Document &quot;{d.title ?? d.type}&quot;:{" "}
                {d.reviewStatus === "rejected"
                  ? "rejected"
                  : "more info needed"}
                {d.reviewNote ? ` — ${d.reviewNote}` : ""}
              </p>
              {d.reviewStatus === "rejected" && d.id && (
                <AppealRow
                  open={!!openAppeal?.("property_document", d.id)}
                  onAppeal={() => onAppeal?.("property_document", d.id!)}
                  subject="Document"
                />
              )}
            </div>
          ))}
          {(review === "rejected" || review === "changes_requested") && (
            <AppealRow
              open={!!openAppeal?.("listing", p._id)}
              onAppeal={() => onAppeal?.("listing", p._id)}
              subject="Listing"
            />
          )}
        </div>
      )}

      {canToggle && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-muted">
            {p.status === "active"
              ? "Visible to buyers"
              : p.status === "inactive"
                ? "Not visible to buyers"
                : ""}
          </span>
          <Button
            size="sm"
            variant={p.status === "active" ? "outline" : "primary"}
            disabled={(p.status !== "active" && !canPublish) || isBusy}
            isLoading={isBusy}
            onClick={onToggle}
          >
            {p.status === "active"
              ? "Hide listing"
              : review === "approved"
                ? "Show again"
                : "Submit for review"}
          </Button>
        </div>
      )}

      {isOwner && videos !== undefined && (
        <details className="group rounded-xl bg-muted/20 px-4 py-3 text-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-foreground">
            <span className="font-medium">Video tour</span>
            <span className="text-xs text-muted group-open:hidden">
              {videos.length > 0 ? `${videos.length} uploaded` : "Add one"}
            </span>
          </summary>
          <div className="mt-3 border-t border-muted/40 pt-2">
            <VideoSection
              userId={userId}
              propertyId={p._id}
              videos={videos}
              disabled={disabled}
              openAppealFor={(id) => !!openAppeal?.("video", id)}
              onAppeal={(id) => onAppeal?.("video", id)}
              onChange={onReload ?? (() => {})}
            />
          </div>
        </details>
      )}
    </li>
  );
}

function VideoSection({
  userId,
  propertyId,
  videos,
  disabled,
  openAppealFor,
  onAppeal,
  onChange,
}: {
  userId: string;
  propertyId: string;
  videos: MyVideo[];
  disabled: boolean;
  openAppealFor: (id: string) => boolean;
  onAppeal: (id: string) => void;
  onChange: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm } = useConfirm();
  const hasActive = videos.some(
    (v) => v.status === "pending" || v.status === "approved",
  );

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadListingVideo(userId, propertyId, file);
      onChange();
    } catch (e) {
      setError(errorText(e, "Upload failed."));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async (id: string) => {
    const confirmed = await confirm({
      title: "Remove this video?",
      message: "It will be removed from this listing. This can't be undone.",
      confirmLabel: "Remove video",
      cancelLabel: "Keep video",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteMyVideo(id);
      onChange();
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <div className="space-y-3 text-xs">
      {videos.map((v) => (
        <div key={v.id} className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">
              {v.fileName ?? "Video"}
            </span>
            <span className="text-muted">
              {v.youtubeVideoId
                ? v.youtubePrivacy === "public"
                  ? "On the Affilhomes YouTube channel"
                  : "Unlisted on YouTube"
                : VIDEO_LABEL[v.status]}
            </span>
            {v.youtubeVideoId && (
              <a
                href={`https://www.youtube.com/watch?v=${v.youtubeVideoId}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Watch
              </a>
            )}
            {!v.youtubeVideoId && v.status !== "approved" && (
              <button
                onClick={() => remove(v.id)}
                className="text-muted hover:text-destructive"
              >
                Remove
              </button>
            )}
          </div>
          {v.reviewNote && v.status !== "approved" && (
            <p className="text-muted">Note from our team: {v.reviewNote}</p>
          )}
          {v.status === "rejected" && !v.storageDeletedAt && (
            <>
              <p className="text-muted">
                Rejected videos are kept for 30 days for appeals, then deleted.
              </p>
              <AppealRow
                open={openAppealFor(v.id)}
                onAppeal={() => onAppeal(v.id)}
                subject="Video"
              />
            </>
          )}
        </div>
      ))}
      {!hasActive && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={input}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <Button
            size="sm"
            variant="outline"
            isLoading={uploading}
            disabled={disabled}
            onClick={() => input.current?.click()}
          >
            Upload video tour
          </Button>
          <span className="text-muted">
            Up to 500 MB. Our team reviews it, then posts it on the Affilhomes
            YouTube channel.
          </span>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
