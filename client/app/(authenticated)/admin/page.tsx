"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { ListingsTab } from "./_components/ListingsTab";
import { VerificationTab } from "./_components/VerificationTab";
import { VideosTab } from "./_components/VideosTab";
import { JVTab } from "./_components/JVTab";
import { AccountsTab } from "./_components/AccountsTab";
import { AppealsTab } from "./_components/AppealsTab";
import { SupportTab } from "./_components/SupportTab";
import { AuditTab } from "./_components/AuditTab";

const TABS = [
  { id: "listings", label: "Listings", C: ListingsTab },
  { id: "verification", label: "Verification", C: VerificationTab },
  { id: "videos", label: "Videos", C: VideosTab },
  { id: "jv", label: "JV", C: JVTab },
  { id: "accounts", label: "Accounts", C: AccountsTab },
  { id: "appeals", label: "Appeals", C: AppealsTab },
  { id: "support", label: "Support", C: SupportTab },
  { id: "audit", label: "Audit log", C: AuditTab },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabId>("listings");

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

  const Active = TABS.find((t) => t.id === tab)!.C;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Every decision needs a reason and is saved in the audit log.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "primary" : "outline"} onClick={() => setTab(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>
      <Active />
    </div>
  );
}
