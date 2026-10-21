"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Role, type PopulatedProperty } from "@affilhomes/shared/types";
import { fetchMyListings } from "@affilhomes/shared/supabase";
import {
  canPublishListings,
  errorText,
  setListingStatus,
} from "@affilhomes/shared/supabase/admin";
import {
  deleteMyVideo,
  fetchMyAppeals,
  fetchMySuspension,
  fetchMyVideos,
  submitAppeal,
  uploadListingVideo,
  type AppealSubject,
  type MyAppeal,
  type MyVideo,
} from "@affilhomes/shared/supabase";
import { formatPrice } from "@/lib/formatters";
import { Button } from "@affilhomes/shared/ui/Button";
import { Skeleton } from "@affilhomes/shared/ui";
import { useConfirm } from "@/contexts/ConfirmDialog";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Live",
  inactive: "Hidden",
  sold: "Sold",
  rented: "Rented",
};

const REVIEW_LABEL: Record<string, string> = {
  pending: "Waiting for admin review",
  rejected: "Rejected",
  changes_requested: "Changes requested",
};

const VIDEO_LABEL: Record<string, string> = {
  pending: "Video waiting for review",
  approved: "Video approved",
  rejected: "Video rejected",
  changes_requested: "Video changes requested",
};

export default function MyListingsPage() {
  const { user, isLoading } = useAuth();
  const [listings, setListings] = useState<PopulatedProperty[] | null>(null);
  const [videos, setVideos] = useState<MyVideo[]>([]);
  const [appeals, setAppeals] = useState<MyAppeal[]>([]);
  const [suspension, setSuspension] = useState<{
    subjectType: string;
    subjectId: string;
    reason: string;
  } | null>(null);
  const [canPublish, setCanPublish] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      fetchMyListings(user),
      canPublishListings(user._id),
      fetchMyVideos().catch(() => []),
      fetchMyAppeals().catch(() => []),
      fetchMySuspension(),
    ])
      .then(([rows, ok, vids, apps, susp]) => {
        if (cancelled) return;
        setListings(rows);
        setCanPublish(ok);
        setVideos(vids);
        setAppeals(apps);
        setSuspension(susp);
      })
      .catch(() => !cancelled && setError("Couldn't load your listings."));
    return () => {
      cancelled = true;
    };
  }, [user, tick]);

  if (isLoading || (user && !listings && !error)) {
    return <MyListingsSkeleton />;
  }
  if (!user) return null;

  const reload = () => setTick((t) => t + 1);
  const isCompany = user.activeRole === Role.Company;
  const agentStatus = user.agentProfile?.verificationStatus ?? "unverified";
  const openAppeal = (type: AppealSubject, id: string) =>
    appeals.find(
      (a) =>
        a.subjectType === type && a.subjectId === id && a.status === "open",
    );

  const toggle = async (p: PopulatedProperty) => {
    setBusyId(p._id);
    setError(null);
    setNotice(null);
    try {
      const result = await setListingStatus(
        p._id,
        p.status === "active" ? "inactive" : "active",
      );
      if (result === "pending")
        setNotice(
          "Sent for review. Our team will check it before it goes live.",
        );
      reload();
    } catch (e) {
      setError(errorText(e, "Couldn't update this listing."));
    } finally {
      setBusyId(null);
    }
  };

  const appeal = async (type: AppealSubject, id: string) => {
    const message = window.prompt(
      "Tell our team why this decision should be reviewed again (at least 10 characters):",
    );
    if (!message) return;
    try {
      await submitAppeal(type, id, message);
      setNotice("Appeal sent. You'll see the reply here.");
      reload();
    } catch (e) {
      setError(errorText(e, "Couldn't send your appeal."));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My listings</h1>
          <p className="text-sm text-muted">
            Submit a listing for review. It goes live after our team approves
            it.
          </p>
        </div>
        <Button href="/list-property" size="sm">
          New listing
        </Button>
      </div>

      {suspension && (
        <div className="space-y-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">
            Your account is suspended
          </p>
          <p className="text-muted">Reason: {suspension.reason}</p>
          <div className="flex flex-wrap gap-2">
            {!openAppeal("suspension", suspension.subjectId) ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => appeal("suspension", suspension.subjectId)}
              >
                Appeal
              </Button>
            ) : (
              <span className="text-xs text-muted">
                Appeal sent — waiting for a reply.
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              href="/support?subject=Suspension"
            >
              Contact support
            </Button>
          </div>
        </div>
      )}

      {!canPublish && !suspension && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          {isCompany ? (
            <p className="text-muted">
              Your company is waiting for verification. You can submit listings
              once our team approves your documents.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted">
                {agentStatus === "pending"
                  ? "Your verification is being reviewed. You can submit listings once it's approved."
                  : "Get verified to submit your listings. You'll need a government ID."}
              </p>
              <Button size="sm" variant="outline" href="/verification">
                {agentStatus === "pending" ? "View status" : "Get verified"}
              </Button>
            </div>
          )}
        </div>
      )}

      {notice && <p className="text-sm text-foreground">{notice}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {listings && listings.length === 0 ? (
        <p className="py-10 text-center text-muted">
          You have no listings yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {listings?.map((p) => {
            const review = p.reviewStatus ?? "none";
            const rejectedDocs = (p.documents ?? []).filter(
              (d) =>
                d.reviewStatus === "rejected" || d.reviewStatus === "more_info",
            );
            const myVideos = videos.filter((v) => v.propertyId === p._id);
            const canToggle =
              (p.status === "draft" ||
                p.status === "inactive" ||
                p.status === "active") &&
              review !== "pending";
            return (
              <li key={p._id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {p.status === "active" ? (
                        <Link
                          href={`/properties/${p.slug}`}
                          className="hover:underline"
                        >
                          {p.title}
                        </Link>
                      ) : (
                        p.title
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {p.location?.city} ·{" "}
                      {formatPrice(p.price, { currency: p.currency })}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {REVIEW_LABEL[review] ?? STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  {canToggle && (
                    <Button
                      size="sm"
                      variant={p.status === "active" ? "outline" : "primary"}
                      disabled={
                        (p.status !== "active" && !canPublish) ||
                        busyId === p._id
                      }
                      isLoading={busyId === p._id}
                      onClick={() => toggle(p)}
                    >
                      {p.status === "active"
                        ? "Hide"
                        : review === "approved"
                          ? "Show again"
                          : "Submit for review"}
                    </Button>
                  )}
                </div>

                {p.reviewNote && review !== "approved" && (
                  <p className="text-xs text-muted">
                    Note from our team: {p.reviewNote}
                  </p>
                )}
                {(review === "rejected" || review === "changes_requested") && (
                  <AppealRow
                    open={!!openAppeal("listing", p._id)}
                    onAppeal={() => appeal("listing", p._id)}
                    subject="Listing"
                  />
                )}
                {rejectedDocs.map((d) => (
                  <div key={d.id} className="space-y-1 text-xs">
                    <p className="text-muted">
                      Document &quot;{d.title ?? d.type}&quot;:{" "}
                      {d.reviewStatus === "rejected"
                        ? "rejected"
                        : "more info needed"}
                      {d.reviewNote ? ` — ${d.reviewNote}` : ""}
                    </p>
                    {d.reviewStatus === "rejected" && d.id && (
                      <AppealRow
                        open={!!openAppeal("property_document", d.id)}
                        onAppeal={() => appeal("property_document", d.id!)}
                        subject="Document"
                      />
                    )}
                  </div>
                ))}

                <VideoSection
                  userId={user._id}
                  propertyId={p._id}
                  videos={myVideos}
                  disabled={!!suspension}
                  openAppealFor={(id) => !!openAppeal("video", id)}
                  onAppeal={(id) => appeal("video", id)}
                  onChange={reload}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AppealRow({
  open,
  onAppeal,
  subject,
}: {
  open: boolean;
  onAppeal: () => void;
  subject: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {open ? (
        <span className="text-xs text-muted">
          Appeal sent — waiting for a reply.
        </span>
      ) : (
        <Button size="sm" variant="outline" onClick={onAppeal}>
          Appeal
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        href={`/support?subject=${encodeURIComponent(`${subject} decision`)}`}
      >
        Contact support
      </Button>
    </div>
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
    <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-xs">
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

function ListingRowSkeleton() {
  return (
    <li className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4 max-w-xs" />
          <Skeleton className="h-3 w-1/2 max-w-56" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>

      <div className="rounded-xl bg-muted/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-24 rounded-md ml-auto" />
        </div>
      </div>
    </li>
  );
}

function MyListingsSkeleton() {
  return (
    <div
      className="mx-auto max-w-4xl space-y-6 px-4 py-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading your listings…</span>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListingRowSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}
