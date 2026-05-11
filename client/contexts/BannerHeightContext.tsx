"use client";

import React, { createContext, useContext, useRef } from "react";
import { useBannerHeight } from "@/hooks/useBannerHeight";

interface BannerHeightContextValue {
  bannerHeight: number;
  bannerRef: React.RefObject<HTMLDivElement | null>;
}

const BannerHeightContext = createContext<BannerHeightContextValue | undefined>(
  undefined,
);

export const BannerHeightProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const { bannerHeight } = useBannerHeight(bannerRef);

  return (
    <BannerHeightContext.Provider value={{ bannerHeight, bannerRef }}>
      {children}
    </BannerHeightContext.Provider>
  );
};

export const useBannerHeightContext = () => {
  const context = useContext(BannerHeightContext);
  if (!context) {
    throw new Error(
      "useBannerHeightContext must be used within a BannerHeightProvider",
    );
  }
  return context;
};
