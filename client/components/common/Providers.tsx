"use client";

import React, { useState, useEffect } from "react";
import { Ad, dummyAds } from "@/data/ads";
import { Banner } from "@/components/common/Banner";
import { Sidebar } from "@/components/common/Sidebar";
import {
  BannerHeightProvider,
  useBannerHeightContext,
} from "@/contexts/BannerHeightContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
} from "@/utils/constants";
import { ConfirmationProvider } from "@/contexts/ConfirmDialog";

const getAds = () =>
  new Promise<Ad[]>((resolve) => setTimeout(() => resolve(dummyAds), 800));

const LayoutWithBanner = ({ children }: { children: React.ReactNode }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const { bannerRef, bannerHeight } = useBannerHeightContext();
  const {
    isSidebarOpen,
    toggleOpen,
    isCollapsed: isSidebarCollapsed,
    toggleIsCollapsed,
  } = useSidebar();

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const sidebarWidth = isDesktop
    ? isSidebarCollapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_EXPANDED_WIDTH
    : 0;

  useEffect(() => {
    getAds().then(setAds);
  }, []);

  return (
    <>
      <header
        ref={bannerRef}
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 100,
          transition: "padding-left 0.3s ease",
        }}
      >
        <Banner ads={ads} />
      </header>
      <div
        style={{
          paddingTop: bannerHeight,
          paddingLeft: sidebarWidth,
          transition: "padding-left 0.3s ease",
          minHeight: "100vh",
        }}
      >
        <main>{children}</main>
      </div>
      {isDesktop ? (
        <Sidebar
          variant="collapsible"
          collapsed={isSidebarCollapsed}
          onCollapsedChange={toggleIsCollapsed}
        />
      ) : (
        <Sidebar
          variant="overlay"
          isOpen={isSidebarOpen}
          onClose={toggleOpen}
        />
      )}
      <style jsx>{`
        :root {
          --banner-height: ${bannerHeight}px;
        }
      `}</style>
    </>
  );
};

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <BannerHeightProvider>
      <ConfirmationProvider>
        <SidebarProvider>
          <LayoutWithBanner>{children}</LayoutWithBanner>
        </SidebarProvider>
      </ConfirmationProvider>
    </BannerHeightProvider>
  );
};
