"use client";

import { cn } from "@affilhomes/shared/utils";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, useSidebar } from "./SidebarProvider";
import { Topbar } from "./Topbar";

const TOPBAR_HEIGHT_CLASS = "h-16";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-30 border-b border-border bg-background",
          "left-0 transition-[left] duration-300 ease-in-out",
          "lg:left-auto",
          collapsed ? "lg:left-sidebar-collapsed" : "lg:left-sidebar-expanded",
          TOPBAR_HEIGHT_CLASS,
        )}
      >
        <Topbar />
      </header>

      <div
        className={cn(
          "min-h-screen pt-16 pl-0",
          "transition-[padding] duration-300 ease-in-out",
          collapsed ? "lg:pl-sidebar-collapsed" : "lg:pl-sidebar-expanded",
        )}
      >
        <main className="px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>

      <Sidebar />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}
