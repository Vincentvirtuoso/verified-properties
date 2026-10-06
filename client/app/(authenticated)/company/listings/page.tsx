"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { fetchTeamProfiles } from "@/lib/supabase/companies";
import { canPublishListings, setListingStatus } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";

type Status = "draft" | "active" | "inactive" | "sold" | "rented";

interface Row {
  id: string;
  slug: string;
  title: string;
  status: Status;
  price: number;
  currency: string;
  city: string;
  ownerId: string;
  ownerName: string;
  enquiries: number;
  createdAt: string;
}

const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft",
  active: "Live",
  inactive: "Hidden",
  sold: "Sold",
  rented: "Rented",
};

const FILTERS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Live" },
  { key: "draft", label: "Drafts" },
  { key: "inactive", label: "Hidden" },
];

export default function CompanyListingsPage() {
  const { user, companies, isLoading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [canPublish, setCanPublish] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      // RLS: company members can see every company listing by teammates.
      const { data, error } = await supabase
        .from("properties")
        .select("id, slug, title, status, price, currency, city, owner_id, total_inquiries, created_at")
        .eq("owner_type", "company")
        .in("owner_id", memberIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const [names, ok] = await Promise.all([
        fetchTeamProfiles(memberIds),
        canPublishListings(user._id),
      ]);
      if (cancelled) return;
      setCanPublish(ok);
      setRows(
        (data ?? []).map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          status: r.status,
          price: Number(r.price),
          currency: r.currency,
          city: r.city,
          ownerId: r.owner_id,
          ownerName: r.owner_id === user._id ? "You" : names.get(r.owner_id)?.name ?? "Team member",
          enquiries: r.total_inquiries ?? 0,
          createdAt: r.created_at,
        })),
      );
    })().catch(() => !cancelled && setError("Couldn't load company listings."));
    return () => {
      cancelled = true;
    };
  }, [user, memberKey]);

  const visible = useMemo(
    () => (rows ?? []).filter((r) => filter === "all" || r.status === filter),
    [rows, filter],
  );

  if (isLoading) return <PageSpinner label="Loading company listings…" />;
  if (!user) return null;
  if (!company) {
    return (
      <p className="p-10 text-center text-muted-foreground">
        You are not part of a company yet.
      </p>
    );
  }
  if (!rows && !error) return <PageSpinner label="Loading company listings…" />;

  const toggle = async (r: Row) => {
    const next = r.status === "active" ? "inactive" : "active";
    setBusyId(r.id);
    setError(null);
    try {
      await setListingStatus(r.id, next);
      setRows((all) => all?.map((x) => (x.id === r.id ? { ...x, status: next } : x)) ?? null);
    } catch {
      setError(
        next === "active"
          ? "Couldn't publish. Your company must be verified first."
          : "Couldn't hide this listing.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{company.name} listings</h1>
          <p className="text-sm text-muted-foreground">
            Every listing posted for the company by your team.
          </p>
        </div>
        <Button href="/list-property" size="sm">New listing</Button>
      </div>

      {!canPublish && (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Your company is waiting for verification. Listings can be published once it&apos;s approved.
        </p>
      )}

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-sm ${filter === f.key ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"}`}
          >
            {f.label} ({f.key === "all" ? rows?.length ?? 0 : rows?.filter((r) => r.status === f.key).length ?? 0})
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {visible.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No listings here yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {visible.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {r.status === "active" ? (
                    <Link href={`/properties/${r.slug}`} className="hover:underline">{r.title}</Link>
                  ) : (
                    r.title
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.city} · {formatPrice(r.price, { currency: r.currency })} · by {r.ownerName} ·{" "}
                  {r.enquiries} enquir{r.enquiries === 1 ? "y" : "ies"}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
              {r.ownerId === user._id && ["draft", "inactive", "active"].includes(r.status) && (
                <Button
                  size="sm"
                  variant={r.status === "active" ? "outline" : "primary"}
                  disabled={(r.status !== "active" && !canPublish) || busyId === r.id}
                  isLoading={busyId === r.id}
                  onClick={() => toggle(r)}
                >
                  {r.status === "active" ? "Hide" : "Publish"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
