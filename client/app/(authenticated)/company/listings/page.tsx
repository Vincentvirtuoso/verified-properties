"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@affilhomes/shared/supabase/client";
import type {
  PopulatedProperty,
  PopulatedUser,
} from "@affilhomes/shared/types";
import {
  fetchMyAppeals,
  fetchTeamProfiles,
  mapPropertyRow,
  PROPERTY_SELECT,
  submitAppeal,
  type AppealSubject,
  type MyAppeal,
} from "@affilhomes/shared/supabase";
import {
  canPublishListings,
  errorText,
  setListingStatus,
} from "@affilhomes/shared/supabase/admin";
import { Button } from "@affilhomes/shared/ui/Button";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton";
import {
  MyListingsCard,
  getBucket,
  type Bucket,
  type StateKey,
} from "@/components/common/MyListingsCard";

type Status = "draft" | "active" | "inactive" | "sold" | "rented";

type Listing = {
  property: PopulatedProperty;
  ownerId: string;
  ownerName: string;
  enquiries: number;
};

const FILTERS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Live" },
  { key: "draft", label: "Drafts" },
  { key: "inactive", label: "Hidden" },
];

function CompanyListingsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="space-y-3 rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CompanyListingsPage() {
  const { user, companies, isLoading } = useAuth();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [appeals, setAppeals] = useState<MyAppeal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [canPublish, setCanPublish] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const companyId =
    typeof user?.companyId === "string" ? user.companyId : user?.companyId?._id;
  const company = companies.find((c) => c._id === companyId);
  const memberKey = company?.team.map((m) => m.userId).join(",") ?? "";

  useEffect(() => {
    if (!user || !memberKey) return;
    const memberIds = memberKey.split(",");
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("owner_type", "company")
        .in("owner_id", memberIds)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const [names, ok, myAppeals] = await Promise.all([
        fetchTeamProfiles(memberIds),
        canPublishListings(user._id),
        fetchMyAppeals().catch(() => [] as MyAppeal[]),
      ]);

      if (cancelled) return;

      setCanPublish(ok);
      setAppeals(myAppeals);
      setListings(
        (data ?? []).map((r) => {
          const owner = { _id: r.owner_id } as PopulatedUser;
          return {
            property: mapPropertyRow(r, owner),
            ownerId: r.owner_id,
            ownerName:
              r.owner_id === user._id
                ? "You"
                : (names.get(r.owner_id)?.name ?? "Team member"),
            enquiries: r.total_inquiries ?? 0,
          };
        }),
      );
    })().catch(() => !cancelled && setError("Couldn't load company listings."));

    return () => {
      cancelled = true;
    };
  }, [user, memberKey, tick]);

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
    for (const l of listings ?? []) {
      c.all += 1;
      c[getBucket(l.property)] += 1;
    }
    return c;
  }, [listings]);

  const visible = useMemo(
    () =>
      (listings ?? []).filter(
        (l) => filter === "all" || l.property.status === filter,
      ),
    [listings, filter],
  );

  if (isLoading) return <CompanyListingsSkeleton />;
  if (!user) return null;
  if (!company) {
    return (
      <p className="p-10 text-center text-muted">
        You are not part of a company yet.
      </p>
    );
  }
  if (!listings && !error) return <CompanyListingsSkeleton />;

  const reload = () => setTick((t) => t + 1);

  const toggle = async (l: Listing) => {
    const next = l.property.status === "active" ? "inactive" : "active";
    setBusyId(l.property._id);
    setError(null);
    try {
      const result = await setListingStatus(l.property._id, next);
      if (result === "pending") {
        setError("Sent for review. It goes live after our team approves it.");
      } else {
        reload();
      }
    } catch (e) {
      setError(
        errorText(
          e,
          next === "active"
            ? "Couldn't submit. Your company must be verified first."
            : "Couldn't hide this listing.",
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  const openAppeal = (type: AppealSubject, id: string) =>
    appeals.find(
      (a) =>
        a.subjectType === type && a.subjectId === id && a.status === "open",
    );

  const appeal = async (type: AppealSubject, id: string) => {
    const message = window.prompt(
      "Tell our team why this decision should be reviewed again (at least 10 characters):",
    );
    if (!message) return;
    try {
      await submitAppeal(type, id, message);
      setError(null);
      reload();
    } catch (e) {
      setError(errorText(e, "Couldn't send your appeal."));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {company.name} listings
          </h1>
          <p className="text-sm text-muted">
            Every listing posted for the company by your team.
          </p>
        </div>
        <Button href="/list-property" size="sm">
          New listing
        </Button>
      </div>

      {!canPublish && (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted">
          Your company is waiting for verification. Listings can be published
          once it&apos;s approved.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs ${
              filter === f.key
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted"
            }`}
          >
            {f.label} (
            {f.key === "all"
              ? (listings?.length ?? 0)
              : (listings?.filter((l) => l.property.status === f.key).length ??
                0)}
            )
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="py-10 text-center text-muted">No listings here yet.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((l) => {
            const bucket: StateKey = getBucket(l.property);
            const isOwner = l.ownerId === user._id;
            return (
              <MyListingsCard
                key={l.property._id}
                listing={l.property}
                bucket={bucket}
                isOwner={isOwner}
                ownerName={l.ownerName}
                enquiries={l.enquiries}
                canPublish={canPublish}
                isBusy={busyId === l.property._id}
                userId={l.ownerId}
                disabled={false}
                openAppeal={isOwner ? openAppeal : undefined}
                onAppeal={isOwner ? appeal : undefined}
                onToggle={() => toggle(l)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
