"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const PAGE_SIZE = 8;

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

type Bucket =
  | "all"
  | "live"
  | "pending"
  | "attention"
  | "hidden"
  | "draft"
  | "closed";

type StateKey = Exclude<Bucket, "all">;

const TABS: { key: Bucket; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "pending", label: "Pending review" },
  { key: "attention", label: "Needs attention" },
  { key: "hidden", label: "Hidden" },
  { key: "draft", label: "Drafts" },
  { key: "closed", label: "Sold / rented" },
];

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

function getRejectedDocs(p: PopulatedProperty) {
  return (p.documents ?? []).filter(
    (d) => d.reviewStatus === "rejected" || d.reviewStatus === "more_info",
  );
}

function getBucket(p: PopulatedProperty): StateKey {
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

function getBadgeLabel(p: PopulatedProperty): string {
  const review = p.reviewStatus ?? "none";
  if (review === "pending") return "Waiting for review";
  if (review === "rejected") return "Rejected";
  if (review === "changes_requested") return "Changes requested";
  return STATUS_LABEL[p.status] ?? p.status;
}

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
  const [tab, setTab] = useState<Bucket>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

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

  // Reset to the first page whenever the view changes.
  useEffect(() => {
    setPage(1);
  }, [tab, query]);

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = {
      all: 0,
      live: 0,
      pending: 0,
      attention: 0,
      hidden: 0,
      draft: 0,
      closed: 0,
    };
    for (const p of listings ?? []) {
      c.all += 1;
      c[getBucket(p)] += 1;
    }
    return c;
  }, [listings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (listings ?? []).filter((p) => {
      if (tab !== "all" && getBucket(p) !== tab) return false;
      if (!q) return true;
      return (
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.location?.city ?? "").toLowerCase().includes(q)
      );
    });
  }, [listings, tab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

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

  const hasFilters = tab !== "all" || query.trim() !== "";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My listings</h1>
          <p className="mt-1 text-sm text-muted">
            Listings go live once our team approves them.
          </p>
        </div>
        <Button href="/list-property" size="sm">
          New listing
        </Button>
      </div>

      {listings && listings.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Live"
            value={counts.live}
            active={tab === "live"}
            onClick={() => setTab("live")}
          />
          <StatCard
            label="Pending review"
            value={counts.pending}
            active={tab === "pending"}
            onClick={() => setTab("pending")}
          />
          <StatCard
            label="Needs attention"
            value={counts.attention}
            tone={counts.attention > 0 ? "danger" : undefined}
            active={tab === "attention"}
            onClick={() => setTab("attention")}
          />
          <StatCard
            label="Total"
            value={counts.all}
            active={tab === "all"}
            onClick={() => setTab("all")}
          />
        </div>
      )}

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
              <span className="self-center text-xs text-muted">
                Appeal sent, waiting for a reply.
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

      {notice && (
        <p className="rounded-xl bg-primary/5 px-4 py-3 text-sm text-foreground">
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {listings && listings.length > 0 && (
        <div className="space-y-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or city"
            aria-label="Search listings"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/30 sm:max-w-xs"
          />
          <div
            role="tablist"
            aria-label="Filter listings"
            className="flex gap-1 overflow-x-auto border-b border-border pb-px hide-scrollbar"
          >
            {TABS.map((t) => {
              const selected = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(t.key)}
                  className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors ${
                    selected
                      ? "border-primary font-semibold text-foreground"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      selected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/30 text-muted"
                    }`}
                  >
                    {counts[t.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {listings && listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center">
          <p className="font-medium text-foreground">No listings yet</p>
          <p className="mt-1 text-sm text-muted">
            Create your first listing to get started.
          </p>
          <div className="mt-4">
            <Button href="/list-property" size="sm">
              New listing
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted">No listings match your filters.</p>
          {hasFilters && (
            <button
              onClick={() => {
                setTab("all");
                setQuery("");
              }}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {pageItems.map((p) => {
              const review = p.reviewStatus ?? "none";
              const bucket = getBucket(p);
              const rejectedDocs = getRejectedDocs(p);
              const myVideos = videos.filter((v) => v.propertyId === p._id);
              const canToggle =
                (p.status === "draft" ||
                  p.status === "inactive" ||
                  p.status === "active") &&
                review !== "pending";
              const needsAttention = bucket === "attention";

              return (
                <li
                  key={p._id}
                  className={`space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm ${ACCENT_STYLE[bucket]}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-foreground">
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
                      <p className="mt-0.5 text-sm text-muted">
                        {p.location?.city} ·{" "}
                        {formatPrice(p.price, { currency: p.currency })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_STYLE[bucket]}`}
                    >
                      {getBadgeLabel(p)}
                    </span>
                  </div>

                  {bucket === "pending" && (
                    <p className="text-sm text-muted">
                      Our team is reviewing this listing.
                    </p>
                  )}

                  {p.reviewNote && review !== "approved" && (
                    <p className="text-sm text-muted">
                      Note from our team: {p.reviewNote}
                    </p>
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
                              open={!!openAppeal("property_document", d.id)}
                              onAppeal={() =>
                                appeal("property_document", d.id!)
                              }
                              subject="Document"
                            />
                          )}
                        </div>
                      ))}
                      {(review === "rejected" ||
                        review === "changes_requested") && (
                        <AppealRow
                          open={!!openAppeal("listing", p._id)}
                          onAppeal={() => appeal("listing", p._id)}
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
                        disabled={
                          (p.status !== "active" && !canPublish) ||
                          busyId === p._id
                        }
                        isLoading={busyId === p._id}
                        onClick={() => toggle(p)}
                      >
                        {p.status === "active"
                          ? "Hide listing"
                          : review === "approved"
                            ? "Show again"
                            : "Submit for review"}
                      </Button>
                    </div>
                  )}

                  <details className="group rounded-xl bg-muted/20 px-4 py-3 text-sm">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-foreground">
                      <span className="font-medium">Video tour</span>
                      <span className="text-xs text-muted group-open:hidden">
                        {myVideos.length > 0
                          ? `${myVideos.length} uploaded`
                          : "Add one"}
                      </span>
                    </summary>
                    <div className="mt-3 pt-2 border-t border-muted/40">
                      <VideoSection
                        userId={user._id}
                        propertyId={p._id}
                        videos={myVideos}
                        disabled={!!suspension}
                        openAppealFor={(id) => !!openAppeal("video", id)}
                        onAppeal={(id) => appeal("video", id)}
                        onChange={reload}
                      />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  onClick,
  active,
  tone,
}: {
  label: string;
  value: number;
  onClick: () => void;
  active: boolean;
  tone?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-colors ${
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <p
        className={`text-2xl font-bold ${
          tone === "danger" ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 pt-2"
    >
      <p className="text-sm text-muted">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <span className="px-2 text-sm text-muted">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
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
          Appeal sent, waiting for a reply.
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

function MyListingsSkeleton() {
  return (
    <div
      className="mx-auto max-w-4xl space-y-6 px-4 py-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading your listings…</span>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="space-y-4 rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 max-w-xs" />
                <Skeleton className="h-3 w-1/2 max-w-56" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
