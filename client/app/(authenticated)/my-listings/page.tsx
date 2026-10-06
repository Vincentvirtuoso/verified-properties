"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Role, type PopulatedProperty } from "@/types";
import { fetchMyListings } from "@/lib/supabase/properties";
import {
  canPublishListings,
  requestAgentVerification,
  setListingStatus,
} from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Live",
  inactive: "Hidden",
  sold: "Sold",
  rented: "Rented",
};

export default function MyListingsPage() {
  const { user, isLoading } = useAuth();
  const [listings, setListings] = useState<PopulatedProperty[] | null>(null);
  const [canPublish, setCanPublish] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyState, setVerifyState] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([fetchMyListings(user), canPublishListings(user._id)])
      .then(([rows, ok]) => {
        if (cancelled) return;
        setListings(rows);
        setCanPublish(ok);
      })
      .catch(() => !cancelled && setError("Couldn't load your listings."));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading || (user && !listings && !error)) {
    return <PageSpinner label="Loading your listings…" />;
  }
  if (!user) return null;

  const isCompany = user.activeRole === Role.Company;
  const agentStatus = verifyState ?? user.agentProfile?.verificationStatus ?? "unverified";

  const toggle = async (p: PopulatedProperty) => {
    const next = p.status === "active" ? "inactive" : "active";
    setBusyId(p._id);
    setError(null);
    try {
      await setListingStatus(p._id, next);
      setListings((rows) => rows?.map((r) => (r._id === p._id ? { ...r, status: next } : r)) ?? null);
    } catch {
      setError(
        next === "active"
          ? "This listing couldn't be published. Your account must be verified first."
          : "Couldn't hide this listing. Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const askVerification = async () => {
    try {
      setVerifyState(await requestAgentVerification());
    } catch {
      setError("Couldn't send your verification request.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My listings</h1>
          <p className="text-sm text-muted-foreground">Publish a draft to show it on the site.</p>
        </div>
        <Button href="/list-property" size="sm">New listing</Button>
      </div>

      {!canPublish && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          {isCompany ? (
            <p className="text-muted-foreground">
              Your company is waiting for verification. You can publish listings once our team approves your documents.
            </p>
          ) : agentStatus === "pending" ? (
            <p className="text-muted-foreground">
              Your verification request is being reviewed. You can publish once it&apos;s approved.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground">
                {agentStatus === "rejected"
                  ? "Your last verification request was declined. You can ask again."
                  : "Get verified to publish your listings."}
              </p>
              <Button size="sm" variant="outline" onClick={askVerification}>
                Request verification
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {listings && listings.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">You have no listings yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {listings?.map((p) => (
            <li key={p._id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {p.status === "active" ? (
                    <Link href={`/properties/${p.slug}`} className="hover:underline">{p.title}</Link>
                  ) : (
                    p.title
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.location?.city} · {formatPrice(p.price, { currency: p.currency })}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {STATUS_LABEL[p.status] ?? p.status}
              </span>
              {(p.status === "draft" || p.status === "inactive" || p.status === "active") && (
                <Button
                  size="sm"
                  variant={p.status === "active" ? "outline" : "primary"}
                  disabled={(p.status !== "active" && !canPublish) || busyId === p._id}
                  isLoading={busyId === p._id}
                  onClick={() => toggle(p)}
                >
                  {p.status === "active" ? "Hide" : "Publish"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
