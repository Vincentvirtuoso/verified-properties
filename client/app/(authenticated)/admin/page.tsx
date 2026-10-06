"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminUnpublish,
  documentLink,
  fetchAdminListings,
  fetchVerificationQueue,
  isAdmin,
  setVerification,
  type AdminListing,
  type VerificationItem,
  type VerificationStatus,
} from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";

type Tab = "verification" | "listings";

const DOC_LABELS: Record<string, string> = {
  cacCertificateUrl: "CAC certificate",
  companyLogoUrl: "Logo",
};

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("verification");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    isAdmin().then((ok) => !cancelled && setAllowed(ok));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading || (user && allowed === null)) return <PageSpinner label="Checking access…" />;
  if (!user || !allowed) {
    return (
      <div className="p-10 text-center">
        <p className="font-semibold text-foreground">This page is for admins only.</p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin</h1>
      <div className="flex gap-2">
        {(["verification", "listings"] as Tab[]).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "primary" : "outline"} onClick={() => setTab(t)}>
            {t === "verification" ? "Verification" : "Listings"}
          </Button>
        ))}
      </div>
      {tab === "verification" ? <VerificationQueue /> : <ListingsModeration />}
    </div>
  );
}

function VerificationQueue() {
  const [status, setStatus] = useState<VerificationStatus>("pending");
  const [items, setItems] = useState<VerificationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetchVerificationQueue(status)
      .then((rows) => !cancelled && setItems(rows))
      .catch(() => !cancelled && setError("Couldn't load the queue."));
    return () => {
      cancelled = true;
    };
  }, [status]);

  const decide = async (item: VerificationItem, next: "verified" | "rejected") => {
    const key = item.subjectType + item.subjectId;
    setBusy(key);
    setError(null);
    try {
      await setVerification(item, next, notes[key]);
      setItems((rows) => rows?.filter((r) => r.subjectType + r.subjectId !== key) ?? null);
    } catch {
      setError("Couldn't save that decision.");
    } finally {
      setBusy(null);
    }
  };

  const openDoc = async (path: string) => {
    try {
      window.open(await documentLink(path), "_blank", "noopener");
    } catch {
      setError("Couldn't open that document.");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex gap-2 text-sm">
        {(["pending", "verified", "rejected"] as VerificationStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setItems(null);
              setStatus(s);
            }}
            className={`rounded-full px-3 py-1 capitalize ${status === s ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"}`}
          >
            {s}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!items ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const key = item.subjectType + item.subjectId;
            const docs = Object.entries(item.documents).filter(
              ([, v]) => typeof v === "string" && v,
            ) as [string, string][];
            return (
              <li key={key} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.subjectType} · {item.detail?.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[item.email, item.phone].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {docs.length === 0 ? (
                    <span className="text-muted-foreground">No documents uploaded</span>
                  ) : (
                    docs.map(([k, v]) => (
                      <button key={k} onClick={() => openDoc(v)} className="text-primary hover:underline">
                        {DOC_LABELS[k] ?? k}
                      </button>
                    ))
                  )}
                </div>
                {status === "pending" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={notes[key] ?? ""}
                      maxLength={500}
                      onChange={(e) => setNotes((n) => ({ ...n, [key]: e.target.value }))}
                      placeholder="Note (optional)"
                      className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                    <Button size="sm" isLoading={busy === key} onClick={() => decide(item, "verified")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" disabled={busy === key} onClick={() => decide(item, "rejected")}>
                      Reject
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ListingsModeration() {
  const [rows, setRows] = useState<AdminListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminListings()
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setError("Couldn't load listings."));
    return () => {
      cancelled = true;
    };
  }, []);

  const takeDown = async (id: string) => {
    if (!window.confirm("Take this listing off the site?")) return;
    try {
      await adminUnpublish(id);
      setRows((r) => r?.map((x) => (x.id === id ? { ...x, status: "inactive" } : x)) ?? null);
    } catch {
      setError("Couldn't take that listing down.");
    }
  };

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!rows) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No listings yet.</p>;

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{r.title}</p>
            <p className="text-xs text-muted-foreground">
              {r.ownerName} · {r.city}, {r.state} · {formatPrice(r.price)}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs capitalize text-primary">{r.status}</span>
          {r.status === "active" && (
            <Button size="sm" variant="outline" onClick={() => takeDown(r.id)}>
              Take down
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
