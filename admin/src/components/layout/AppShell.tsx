"use client";

import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "./SidebarProvider";
import { Topbar } from "./Topbar";

type Props = {
  children: React.ReactNode;
  counts?: Partial<Record<"appeals" | "verification" | "support", number>>;
};

export function AppShell({ children, counts }: Props) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar counts={counts} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
