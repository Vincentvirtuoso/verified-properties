"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EnquiryList } from "@/components/enquiries/EnquiryList";
import { EnquiryThread } from "@/components/enquiries/EnquiryThread";
import { fetchCompanyEnquiries } from "@affilhomes/shared/supabase";
import type { Enquiry } from "@affilhomes/shared/types/enquiry";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { PageSpinner } from "@affilhomes/shared/ui/Spinner";
import { LuChevronDown } from "react-icons/lu";
import { AIPlanCTA } from "@/components/common/AIPlanCTA";
import { useEnquiryListRealtime } from "@/components/enquiries/useEnquiryListRealtime";

export default function CompanyEnquiriesPage() {
  const { user, companies, isLoading } = useAuth();
  const { bannerHeight } = useBannerHeightContext();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState("all");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const updateStickyTop = () => {
      document.documentElement.style.setProperty(
        "--banner-navbar-height",
        `${10 + bannerHeight}px`,
      );
    };
    updateStickyTop();
    window.addEventListener("resize", updateStickyTop);
    return () => window.removeEventListener("resize", updateStickyTop);
  }, [bannerHeight]);

  const companyId =
    typeof user?.companyId === "string" ? user.companyId : user?.companyId?._id;
  const company = companies.find((c) => c._id === companyId);
  const membership = company?.team.find((m) => m.userId === user?._id);

  // Mirrors can_manage_company_enquiries(): the owner, or an admin with manage_enquiries.
  // The database enforces the same rule, so this only decides what to render.
  const canView = Boolean(
    user &&
    company &&
    (company.ownerId === user._id ||
      (membership?.role === "admin" &&
        (membership.permissions ?? []).includes("manage_enquiries"))),
  );
  const viewCompanyId = canView ? company?._id : undefined;

  const loadEnquiries = useCallback(async () => {
    if (!viewCompanyId) return;
    try {
      setEnquiries(await fetchCompanyEnquiries(viewCompanyId));
      setLoadError(null);
    } catch {
      setLoadError("Couldn't load team enquiries. Please refresh.");
    } finally {
      setListLoading(false);
    }
  }, [viewCompanyId]);

  // Only fetch when the viewer is allowed to see the team inbox.
  useEffect(() => {
    if (!viewCompanyId) return;
    setListLoading(true);
    void loadEnquiries();
  }, [viewCompanyId, loadEnquiries]);

  useEnquiryListRealtime({
    viewerId: user?._id,
    selectedId,
    enquiries,
    setEnquiries,
    onUnknownEnquiry: loadEnquiries,
    enabled: canView,
  });

  const agentOptions = useMemo(() => {
    const seen = new Map<string, string>();
    enquiries.forEach((e) => {
      if (e.contactUserId && !seen.has(e.contactUserId)) {
        seen.set(e.contactUserId, e.contactUserName ?? "Unassigned");
      }
    });
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [enquiries]);

  const filtered = useMemo(
    () =>
      agentFilter === "all"
        ? enquiries
        : enquiries.filter((e) => e.contactUserId === agentFilter),
    [enquiries, agentFilter],
  );

  const selected = filtered.find((e) => e.id === selectedId) ?? null;
  const isHolder = selected?.agentId === user?._id;

  if (isLoading || (canView && listLoading)) {
    return <PageSpinner label="Loading team enquiries..." />;
  }

  if (!user) return null;

  if (!company) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
        <p className="text-sm text-muted">No company found.</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
        <p className="text-sm text-muted">
          You don&apos;t have access to team enquiries. Ask the company owner.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-var(--banner-navbar-height,80px)-70px)] flex">
      <div
        className={`w-full md:w-90 md:shrink-0 border-r md:border-border flex flex-col border-transparent ${
          selected ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="px-4 py-4 border-b border-border space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Team Enquiries
            </h1>
            <p className="text-sm text-muted mt-0.5">
              Every conversation your team is having with buyers
            </p>
          </div>

          {agentOptions.length > 1 && (
            <div className="relative">
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All agents</option>
                {agentOptions.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <LuChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
          )}

          {loadError && (
            <p role="alert" className="text-sm text-destructive">
              {loadError}
            </p>
          )}

          <div className="pt-1">
            <AIPlanCTA variant="banner" />
          </div>
        </div>

        <EnquiryList
          enquiries={filtered}
          selectedId={selected?.id}
          onSelect={setSelectedId}
          isAgentSide
          showAgentName={agentFilter === "all"}
        />
      </div>

      <div
        className={`flex-1 flex-col ${selected ? "flex" : "hidden md:flex"} min-w-0`}
      >
        {selected ? (
          <EnquiryThread
            key={selected.id}
            enquiry={selected}
            isAgentSide
            isTeammate={!isHolder}
            readOnly={!isHolder}
            onBack={() => setSelectedId(null)}
            onChanged={loadEnquiries}
          />
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-sm text-muted">
            Select a conversation to view messages and calls
          </div>
        )}
      </div>
    </div>
  );
}
