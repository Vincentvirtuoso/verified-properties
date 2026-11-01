"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role, type PopulatedProperty } from "@affilhomes/shared/types";
import { fetchMyListings } from "@affilhomes/shared/supabase";
import {
  canPublishListings,
  errorText,
  setListingStatus,
} from "@affilhomes/shared/supabase/admin";
import {
  fetchMyAppeals,
  fetchMySuspension,
  fetchMyVideos,
  submitAppeal,
  type AppealSubject,
  type MyAppeal,
  type MyVideo,
} from "@affilhomes/shared/supabase";
import { Button } from "@affilhomes/shared/ui/Button";
import { Skeleton } from "@affilhomes/shared/ui";
import {
  MyListingsCard,
  getBucket,
  type Bucket,
} from "@/components/common/MyListingsCard";

const PAGE_SIZE = 8;

const TABS: { key: Bucket; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "pending", label: "Pending review" },
  { key: "attention", label: "Needs attention" },
  { key: "hidden", label: "Hidden" },
  { key: "draft", label: "Drafts" },
  { key: "closed", label: "Sold / rented" },
];

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
            className="w-full appearance-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-primary/30 sm:max-w-xs"
          />
          <div
            role="tablist"
            aria-label="Filter listings"
            className="hide-scrollbar flex gap-1 overflow-x-auto border-b border-border pb-px"
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
            {pageItems.map((p) => (
              <MyListingsCard
                key={p._id}
                listing={p}
                bucket={getBucket(p)}
                videos={videos.filter((v) => v.propertyId === p._id)}
                canPublish={canPublish}
                isBusy={busyId === p._id}
                userId={user._id}
                disabled={!!suspension}
                openAppeal={openAppeal}
                onToggle={() => toggle(p)}
                onAppeal={appeal}
                onReload={reload}
              />
            ))}
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
