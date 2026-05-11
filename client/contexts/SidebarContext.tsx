"use client";

import React, { createContext, useContext, useState } from "react";

interface SidebarContextValue {
  isSidebarOpen: boolean;
  toggleOpen: () => void;
  isCollapsed: boolean;
  toggleIsCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(
  undefined,
);

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleOpen = () => setIsSidebarOpen((prev) => !prev);
  const toggleIsCollapsed = () => setIsSidebarCollapsed((prev) => !prev);
  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        toggleOpen,
        isCollapsed: isSidebarCollapsed,
        toggleIsCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
};
