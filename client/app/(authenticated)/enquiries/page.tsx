"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { EnquiryList } from "@/components/enquiries/EnquiryList";
import { EnquiryThread } from "@/components/enquiries/EnquiryThread";
import { fetchMyEnquiries } from "@/lib/supabase/enquiries";
import type { Enquiry } from "@/types/enquiry";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { PageSpinner } from "@/components/ui/Spinner";

export default function EnquiriesPage() {
  const { user, isLoading } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { bannerHeight } = useBannerHeightContext();

  useEffect(() => {
    const updateStickyTop = () => {
      const header = document.querySelector("header");
      const headerHeight = header?.getBoundingClientRect().height || 0;

      const topOffset = headerHeight + bannerHeight;

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
        if (!cancelled) setListError("Couldn't load your enquiries. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, isAgentSide]);

  const selected = enquiries.find((e) => e.id === selectedId) ?? null;

  if (isLoading || (user && listLoading)) {
    return <PageSpinner label="Loading your enquiries…" />;
  }

  if (!user) return null;

  return (
    <div className="h-[calc(100dvh-var(--banner-navbar-height,80px)-70px)] flex">
      <div
        className={`w-full md:w-[360px] md:shrink-0 border-r border-border flex flex-col ${
          selected ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="px-4 py-4 border-b border-border">
          <h1 className="text-lg font-semibold text-foreground">
            {isAgentSide ? "Enquiries" : "My Enquiries"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAgentSide
              ? "Buyers who've reached out about your listings"
              : "Your conversations about properties you've enquired on"}
          </p>
        </div>
        {listError && (
          <p className="px-4 py-3 text-sm text-destructive">{listError}</p>
        )}
        <EnquiryList
          enquiries={enquiries}
          selectedId={selected?.id}
          onSelect={setSelectedId}
          isAgentSide={isAgentSide}
        />
      </div>

      <div
        className={`flex-1 flex-col ${selected ? "flex" : "hidden md:flex"}`}
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
          <div className="flex-1 hidden md:flex items-center justify-center text-sm text-muted-foreground">
            Select a conversation to view messages and calls
          </div>
        )}
      </div>
    </div>
  );
}
