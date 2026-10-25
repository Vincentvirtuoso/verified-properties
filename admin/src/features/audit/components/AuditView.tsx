"use client";

import { useEffect, useState } from "react";
import {
  errorText,
  fetchAuditLog,
  type AuditEntry,
} from "@affilhomes/shared/supabase/admin";
import { Button } from "@affilhomes/shared/ui/Button";
import { Empty, FilterChips } from "@/components/ui/ReviewActions";

const AREAS = [
  { value: "", label: "Everything" },
  { value: "listing", label: "Listings" },
  { value: "verification", label: "Verification" },
  { value: "identity_document", label: "ID documents" },
  { value: "property_document", label: "Property documents" },
  { value: "video", label: "Videos" },
  { value: "jv", label: "JV" },
  { value: "account", label: "Suspensions" },
  { value: "appeal", label: "Appeals" },
  { value: "support", label: "Support" },
];

export function AuditTab() {
  const [area, setArea] = useState("");
  const [loaded, setLoaded] = useState<{
    area: string;
    rows: AuditEntry[];
  } | null>(null);
  const rows = loaded?.area === area ? loaded.rows : null;
  const setRows = (r: AuditEntry[]) => setLoaded({ area, rows: r });
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAuditLog({ action: area || undefined })
      .then((r) => {
        if (cancelled) return;
        setLoaded({ area, rows: r });
        setMore(r.length === 100);
      })
      .catch((e) => !cancelled && setError(errorText(e)));
    return () => {
      cancelled = true;
    };
  }, [area]);

  const loadMore = async () => {
    if (!rows?.length) return;
    try {
      const next = await fetchAuditLog({
        action: area || undefined,
        before: rows[rows.length - 1].id,
      });
      setRows([...rows, ...next]);
      setMore(next.length === 100);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <section className="space-y-4">
      <p className="text-xs text-muted-foreground">
        A permanent record of every admin action. It cannot be edited or
        deleted.
      </p>
      <FilterChips value={area} onChange={setArea} options={AREAS} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!rows ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <Empty message="No actions recorded yet." />
      ) : (
        <>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card text-sm">
            {rows.map((r) => (
              <li key={r.id} className="space-y-1 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {r.action.replace(/[._]/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.targetType} {r.targetId?.slice(0, 8)} · by{" "}
                  {r.adminId ? r.adminId.slice(0, 8) : "system"}
                </p>
                {r.reason && (
                  <p className="text-xs text-foreground">Reason: {r.reason}</p>
                )}
              </li>
            ))}
          </ul>
          {more && (
            <Button size="sm" variant="outline" onClick={loadMore}>
              Load older
            </Button>
          )}
        </>
      )}
    </section>
  );
}
