"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { cn } from "@/lib/utils";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton";
import { UpgradeToProCTA } from "@/components/common/UpgradeToProCTA";
import { AICallingSettings } from "@/components/company/AICallingSettings";
import { FaqEditor } from "@/components/company/FaqEditor";
import { DocumentsPanel } from "@/components/company/DocumentsPanel";
import { CompanyDetailsCard } from "@/components/company/CompanyDetailsCard";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { CompanyFeaturesSection } from "@/components/company/CompanyFeaturesSection";
import { setWhatsappNotifications } from "@affilhomes/shared/supabase";

const TABS = [
  { id: "general", label: "General" },
  { id: "ai-calling", label: "AI calling" },
  { id: "training", label: "Training" },
] as const;

type TabId = (typeof TABS)[number]["id"];
const DEFAULT_TAB: TabId = "general";

function InfoRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <Skeleton className="h-3.5 w-32 max-w-[45%]" />
    </div>
  );
}

function SettingsSkeleton({ tab = DEFAULT_TAB }: { tab?: TabId }) {
  return (
    <div
      className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-6"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <header className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48 max-w-full" />
      </header>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <div
            key={t.id}
            className="-mb-px border-b-2 border-transparent px-4 py-2.5"
          >
            <Skeleton
              className={cn("h-4", t.id === "general" ? "w-16" : "w-20")}
            />
          </div>
        ))}
      </div>

      {tab === "general" ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="space-y-1">
            <InfoRowSkeleton />
            <InfoRowSkeleton />
            <InfoRowSkeleton />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-10 w-40 rounded-full" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      )}
    </div>
  );
}

export default function CompanySettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { user, companies, isLoading, refreshCompanies } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const ownId =
    typeof user?.companyId === "string" ? user.companyId : user?.companyId?._id;
  const company = companies.find((c) => c._id === ownId) ?? companies[0];

  const { tier, ready, training } = useEntitlements(company?._id);

  const requested = searchParams.get("tab");
  const requestedTab: TabId = TABS.some((t) => t.id === requested)
    ? (requested as TabId)
    : DEFAULT_TAB;

  if (isLoading || !ready) return <SettingsSkeleton tab={requestedTab} />;

  if (!user || !company) {
    return (
      <p className="p-8 text-center text-sm text-muted">
        You aren&apos;t linked to a company.
      </p>
    );
  }

  const activeTab = requestedTab;

  const isOwner = ownId === company._id;
  const isAdmin = company.team.some(
    (m) => m.userId === user._id && m.role === "admin",
  );
  const canEdit = isOwner || isAdmin;
  const isVerified = company.verificationStatus === "verified";
  const isPending = company.verificationStatus === "pending";
  const isPro = tier === "pro";

  const selectTab = (id: TabId) => {
    router.replace(`?tab=${id}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumbs
        items={[
          {
            href: "/company/dashboard",
            label: "Dashboard",
          },
          { label: "Settings" },
        ]}
      />
      <header>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">{company.name}</p>
      </header>

      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex gap-1 border-b border-border"
      >
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                selected
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <section
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === "general" && (
          <div className="space-y-6">
            <CompanyDetailsCard
              companyId={company._id}
              companyName={company.name}
              details={{
                contactEmail: company.contactEmail,
                contactPhone: company.contactPhone,
                whatsappNumber: company.whatsappNumber,
              }}
              canEdit={canEdit}
              onSaved={() => refreshCompanies()}
            />

            <CompanyFeaturesSection
              features={company.features}
              isPro={isPro}
              isOwner={isOwner}
              onWhatsappChange={async (enabled) => {
                await setWhatsappNotifications(company._id, enabled);
                await refreshCompanies();
              }}
            />
          </div>
        )}
        {activeTab === "ai-calling" && (
          <div className="space-y-6">
            {(isVerified || isPending) && (
              <AICallingSettings
                companyId={company._id}
                canEdit={canEdit}
                canActivate={isVerified && isPro}
              />
            )}

            {!isPro && <UpgradeToProCTA variant="card" />}

            {!isVerified && !isPending && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5 text-sm text-muted">
                Verify your company to set up AI calling.
              </div>
            )}
          </div>
        )}
        {activeTab === "training" && (
          <div className="space-y-6">
            <FaqEditor companyId={company._id} canEdit={canEdit} />

            {training.documents ? (
              <DocumentsPanel
                companyId={company._id}
                userId={user._id}
                canEdit={isOwner || isAdmin}
                quotaMb={training.documentMaxMb}
                perFileMb={training.documentMaxMb}
              />
            ) : (
              <UpgradeToProCTA variant="card" />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
