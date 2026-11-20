"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@affilhomes/shared/types";
import { EnquiryList } from "@/components/enquiries/EnquiryList";
import { EnquiryThread } from "@/components/enquiries/EnquiryThread";
import { fetchMyEnquiries } from "@affilhomes/shared/supabase";
import type { Enquiry } from "@affilhomes/shared/types/enquiry";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { EnquiriesSkeleton } from "@/components/enquiries/EnquirySkeleton";
import { useEnquiryListRealtime } from "@/components/enquiries/useEnquiryListRealtime";
import Link from "next/link";
import { Alert } from "@affilhomes/shared/ui/Alert";

export default function EnquiriesPage() {
  const { user, isLoading, companies, switchRole } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const isAgentSide =
    user?.activeRole === Role.Agent || user?.activeRole === Role.Company;

  const userId = user?._id;
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const loadEnquiries = useCallback(async () => {
    if (!userId) return;
    try {
      setEnquiries(await fetchMyEnquiries(userId, isAgentSide));
      setListError(null);
    } catch {
      setListError("Couldn't load your enquiries. Please refresh.");
    } finally {
      setListLoading(false);
    }
  }, [userId, isAgentSide]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMyEnquiries(userId, isAgentSide)
      .then((rows) => {
        if (!cancelled) setEnquiries(rows);
      })
      .catch(() => {
        if (!cancelled)
          setListError("Couldn't load your enquiries. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, isAgentSide]);

  const selected = enquiries.find((e) => e.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, unreadCount: 0 } : e)),
    );
  };

  useEnquiryListRealtime({
    viewerId: user?._id,
    selectedId,
    enquiries,
    setEnquiries,
    onUnknownEnquiry: loadEnquiries,
    // enabled: !isTeammate,
  });

  const canViewTeamInbox = user
    ? companies.some(
        (c) =>
          c.ownerId === user._id ||
          c.team.some(
            (m) =>
              m.userId === user._id &&
              m.role === "admin" &&
              (m.permissions ?? []).includes("manage_enquiries"),
          ),
      )
    : false;

  const handleRoleSwitch = useCallback(
    async (targetRole: Role) => {
      setSelectedId(null);
      setEnquiries([]);
      setListLoading(true);
      try {
        await switchRole(targetRole);
      } catch {
        await loadEnquiries();
      }
    },
    [switchRole, loadEnquiries],
  );

  if (isLoading || (user && listLoading)) {
    return <EnquiriesSkeleton />;
  }

  if (!user) return null;

  return (
    <div className="h-[calc(100dvh-var(--banner-navbar-height,80px)-70px)] flex">
      <div
        className={`w-full md:w-90 md:shrink-0 border-r border-border flex flex-col ${
          selected ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="px-4 py-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {isAgentSide ? "Enquiries" : "My Enquiries"}
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {isAgentSide
                ? "Buyers who've reached out about your listings"
                : "Your conversations about properties you've enquired on"}
            </p>
          </div>
          {canViewTeamInbox && (
            <Link
              href="/company/enquiries"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              Team enquiries
            </Link>
          )}
        </div>
        {listError && <Alert>{listError}</Alert>}
        <EnquiryList
          enquiries={enquiries}
          selectedId={selected?.id}
          onSelect={handleSelect}
          isAgentSide={isAgentSide}
          isAgentOrViewer
          onRoleSwitch={handleRoleSwitch}
        />
      </div>

      <div
        className={`flex-1 flex-col ${selected ? "flex" : "hidden md:flex"} min-w-0`}
      >
        {selected ? (
          <EnquiryThread
            key={selected.id}
            enquiry={selected}
            isAgentSide={isAgentSide}
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
