"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { EnquiryList } from "@/components/enquiries/EnquiryList";
import { EnquiryThread } from "@/components/enquiries/EnquiryThread";
import { mockEnquiries } from "@/data/enquiries";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { PageSpinner } from "@/components/ui/Spinner";
import { LuChevronDown } from "react-icons/lu";
import { UpgradeToProCTA } from "@/components/common/UpgradeToProCTA";

export default function CompanyEnquiriesPage() {
  const { user, companies, isLoading } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const { bannerHeight } = useBannerHeightContext();

  useEffect(() => {
    const updateStickyTop = () => {
      const topOffset = 10 + bannerHeight;

      document.documentElement.style.setProperty(
        "--banner-navbar-height",
        `${topOffset}px`,
      );
    };

    updateStickyTop();

    window.addEventListener("resize", updateStickyTop);

    return () => {
      window.removeEventListener("resize", updateStickyTop);
    };
  }, [bannerHeight]);

  const companyId =
    typeof user?.companyId === "string" ? user.companyId : user?.companyId?._id;

  const company = companies.find((c) => c._id === companyId);

  const companyEnquiries = useMemo(() => {
    if (!company) return [];
    return mockEnquiries.filter((e) => e.companyId === company._id);
  }, [company]);

  const agentOptions = useMemo(() => {
    const seen = new Map<string, string>();
    companyEnquiries.forEach((e) => {
      if (e.contactUserId && !seen.has(e.contactUserId)) {
        seen.set(e.contactUserId, e.contactUserName ?? "Unassigned");
      }
    });
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [companyEnquiries]);

  const enquiries = useMemo(() => {
    if (agentFilter === "all") return companyEnquiries;
    return companyEnquiries.filter((e) => e.contactUserId === agentFilter);
  }, [companyEnquiries, agentFilter]);

  const selected = enquiries.find((e) => e.id === selectedId) ?? null;

  if (isLoading) {
    return <PageSpinner label="Loading enquiries…" />;
  }

  if (!user) return null;

  if (user.activeRole !== Role.Company) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Switch to your Company account to view team enquiries.
        </p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">No company found.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-var(--banner-navbar-height,80px)-70px)] flex">
      <div
        className={`w-full md:w-[360px] md:shrink-0 border-r border-border flex flex-col ${
          selected ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="px-4 py-4 border-b border-border space-y-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Team Enquiries
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
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
              <LuChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}
          <div className="px-4 pt-3">
            <UpgradeToProCTA variant="banner" />
          </div>
        </div>
        <EnquiryList
          enquiries={enquiries}
          selectedId={selected?.id}
          onSelect={setSelectedId}
          isAgentSide
          showAgentName={agentFilter === "all"}
        />
      </div>

      <div
        className={`flex-1 flex-col ${selected ? "flex" : "hidden md:flex"}`}
      >
        {selected ? (
          <EnquiryThread
            enquiry={selected}
            isAgentSide
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-sm text-muted-foreground">
            Select a conversation to view messages and calls
          </div>
        )}
      </div>
    </div>
  );
}
