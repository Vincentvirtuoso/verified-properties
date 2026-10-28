"use client";

import { useSyncExternalStore } from "react";

const BREAKPOINTS = { tablet: 768, desktop: 1024 } as const;

export type Screen = "mobile" | "tablet" | "desktop";

function getScreen(): Screen {
  const w = window.innerWidth;
  if (w < BREAKPOINTS.tablet) return "mobile";
  if (w < BREAKPOINTS.desktop) return "tablet";
  return "desktop";
}

function subscribe(onChange: () => void) {
  const tablet = window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px)`);
  const desktop = window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`);
  tablet.addEventListener("change", onChange);
  desktop.addEventListener("change", onChange);
  return () => {
    tablet.removeEventListener("change", onChange);
    desktop.removeEventListener("change", onChange);
  };
}

export function useScreen() {
  const screen = useSyncExternalStore(
    subscribe,
    getScreen,
    () => "desktop" as const,
  );

  return {
    screen,
    isMobile: screen === "mobile",
    isTablet: screen === "tablet",
    isDesktop: screen === "desktop",
  };
}
