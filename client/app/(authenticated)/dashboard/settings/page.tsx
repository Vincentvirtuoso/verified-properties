"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAiPlan } from "@/hooks/useAiPlan";
import { DOCUMENT_MAX_MB } from "@/lib/ai-plans";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton";
import { AIPlanCTA } from "@/components/common/AIPlanCTA";
import { AICallingSettings } from "@/components/company/AICallingSettings";
import { FaqEditor } from "@/components/company/FaqEditor";
import { DocumentsPanel } from "@/components/company/DocumentsPanel";
import { AgentDetailsForm } from "@/components/agent/AgentDetailsForm";
import { Button } from "@affilhomes/shared/ui";
// import { AgentVerificationPanel } from "@/components/agent/AgentVerificationPanel";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "ai-calling", label: "Phone numbers" },
  { id: "training", label: "Training" },
] as const;

type TabId = (typeof TABS)[number]["id"];
const DEFAULT_TAB: TabId = "profile";

function SettingsSkeleton() {
  return (
    <div
      className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-6"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export default function AgentSettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <AgentSettingsContent />
    </Suspense>
  );
}

function AgentSettingsContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, live, canTrainDocuments } = useAiPlan("agent", user?._id);

  const requested = searchParams.get("tab");
  const activeTab: TabId = TABS.some((t) => t.id === requested)
    ? (requested as TabId)
    : DEFAULT_TAB;

  if (isLoading || !ready) return <SettingsSkeleton />;

  if (!user) {
    return (
      <p className="p-8 text-center text-sm text-muted">
        Sign in to view your settings.
      </p>
    );
  }

  const verified = user.agentProfile?.verificationStatus === "verified";
  const pending = user.agentProfile?.verificationStatus === "pending";

  const selectTab = (id: TabId) =>
    router.replace(`?tab=${id}`, { scroll: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "Settings" },
        ]}
      />
      <header>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">{user.name}</p>
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
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
              <div>
                <p className="font-semibold text-foreground">Verification</p>
                <p className="mt-1 text-sm text-muted">
                  {user.agentProfile?.verificationStatus === "verified"
                    ? "Your agent account is verified."
                    : "Verify your identity and agent status to publish listings and buy AI plans."}
                </p>
              </div>
              <Button size="sm" variant="outline" href="/verification">
                {user.agentProfile?.verificationStatus === "verified"
                  ? "View status"
                  : "Go to verification"}
              </Button>
            </div>
            <AgentDetailsForm />
          </div>
        )}

        {activeTab === "ai-calling" && (
          <div className="space-y-6">
            {(verified || pending) && (
              <AICallingSettings
                ownerType="agent"
                ownerId={user._id}
                canEdit
                canActivate={verified && live}
              />
            )}
            {!live && <AIPlanCTA ownerType="agent" variant="card" />}
            {!verified && !pending && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5 text-sm text-muted">
                Verify your account to add phone numbers for AI calling.
              </div>
            )}
          </div>
        )}

        {activeTab === "training" && (
          <div className="space-y-6">
            <FaqEditor ownerType="agent" ownerId={user._id} canEdit />
            {canTrainDocuments ? (
              <DocumentsPanel
                ownerType="agent"
                ownerId={user._id}
                userId={user._id}
                canEdit
                quotaMb={DOCUMENT_MAX_MB}
                perFileMb={DOCUMENT_MAX_MB}
              />
            ) : (
              <AIPlanCTA ownerType="agent" variant="card" />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
