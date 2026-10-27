"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuLogOut,
  LuChevronRight,
  LuChevronLeft,
  LuLayoutDashboard,
  LuUsers,
  LuMessagesSquare,
  LuCircleHelp,
  LuSettings,
  LuShieldCheck,
  LuFileWarning,
  LuClipboardList,
} from "react-icons/lu";
import { FiBarChart2 } from "react-icons/fi";
import { Spinner } from "@affilhomes/shared/ui";
import { ListingsIcon } from "@affilhomes/shared/icons";
import { useSidebar } from "./SidebarProvider";
import { cn } from "@affilhomes/shared/utils";
import { useAuth } from "@/providers/AuthProvider";
import Image from "next/image";

const ADMIN_SUMMARY_ENDPOINT = "/api/summary";

type SidebarSlot =
  | { kind: "count"; value: number; max?: number }
  | {
      kind: "label";
      value: string;
      tone?: "info" | "warning" | "success" | "danger";
    }
  | { kind: "loading" };

export interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  category?: string;
  slot?: SidebarSlot;
  isActive?: (pathname: string) => boolean;
  disabled?: boolean;
}

export type AdminLinkData = {
  verificationCount?: number | null;
  appealsCount?: number | null;
  pendingPropertiesCount?: number | null;
  supportCount?: number | null;
  enquiriesCount?: number | null;
  adminRequestsCount?: number | null;
  isLoading?: boolean;
};

import { LuUserPlus } from "react-icons/lu";
import { AdminRole } from "@/types";
import CompanyIcon from "@affilhomes/shared/icons/CompanyIcon";

type Permission =
  | "moderation"
  | "accounts"
  | "listings"
  | "communication"
  | "company_requests"
  | "insights"
  | "admin_requests";

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  admin: ["moderation", "accounts", "listings", "communication", "insights"],
  super_admin: [
    "moderation",
    "accounts",
    "listings",
    "communication",
    "insights",
    "company_requests",
    "admin_requests",
  ],
};

type AdminLink = SidebarLink & { permission?: Permission };

function can(role: AdminRole | null, permission?: Permission): boolean {
  if (!permission) return true;
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

function buildAdminLinks(data: AdminLinkData): AdminLink[] {
  const isLoading = !!data.isLoading;

  const count = (
    value: number | null | undefined,
    max = 99,
  ): SidebarSlot | undefined =>
    isLoading ? { kind: "loading" } : countSlot(value, max);

  return [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LuLayoutDashboard />,
    },
    {
      href: "/verification",
      label: "Verifications",
      icon: <LuShieldCheck />,
      category: "Moderation",
      permission: "moderation",
      ...withSlot(count(data.verificationCount)),
    },
    {
      href: "/appeals",
      label: "Appeals",
      icon: <LuFileWarning />,
      category: "Moderation",
      permission: "moderation",
      ...withSlot(count(data.appealsCount)),
    },
    {
      href: "/accounts",
      label: "Users",
      icon: <LuUsers />,
      category: "Accounts",
      permission: "accounts",
    },
    {
      href: "/listings",
      label: "Listings",
      icon: <ListingsIcon />,
      category: "Listings",
      permission: "listings",
    },
    {
      href: "/properties/pending",
      label: "Pending Review",
      icon: <LuClipboardList />,
      category: "Listings",
      permission: "listings",
      ...withSlot(count(data.pendingPropertiesCount)),
    },
    {
      href: "/support",
      label: "Support",
      icon: <LuCircleHelp />,
      category: "Communication",
      permission: "communication",
      ...withSlot(count(data.supportCount)),
    },
    {
      href: "/enquiries",
      label: "Enquiries",
      icon: <LuMessagesSquare />,
      category: "Communication",
      permission: "communication",
      ...withSlot(count(data.enquiriesCount)),
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: <FiBarChart2 />,
      category: "Insights",
      permission: "insights",
    },
    {
      href: "/admin-requests",
      label: "Admin requests",
      icon: <LuUserPlus />,
      category: "Management",
      permission: "admin_requests",
      ...withSlot(count(data.adminRequestsCount)),
    },
    {
      href: "/company-requests",
      label: "Company requests",
      icon: <CompanyIcon />,
      category: "Management",
      permission: "company_requests",
      // ...withSlot(count(data.companyRequests)),
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <LuSettings />,
      category: "More",
    },
  ];
}

export function getAdminLinks(
  role: AdminRole | null,
  data: AdminLinkData = {},
): SidebarLink[] {
  return buildAdminLinks(data).filter((link) => can(role, link.permission));
}

function countSlot(
  value: number | null | undefined,
  max = 99,
): SidebarSlot | undefined {
  return value && value > 0 ? { kind: "count", value, max } : undefined;
}

function labelSlot(
  value: string | undefined,
  tone: "info" | "warning" | "success" | "danger" = "info",
): SidebarSlot | undefined {
  return value ? { kind: "label", value, tone } : undefined;
}

function withSlot(slot: SidebarSlot | undefined): { slot?: SidebarSlot } {
  return slot ? { slot } : {};
}

function formatCount(slot: Extract<SidebarSlot, { kind: "count" }>) {
  const { value, max } = slot;
  if (max != null && value > max) return `${max}+`;
  return String(value);
}

const labelToneClasses: Record<
  NonNullable<Extract<SidebarSlot, { kind: "label" }>["tone"]>,
  string
> = {
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  danger: "bg-destructive/10 text-destructive",
};

function SlotBadge({
  slot,
  active,
  collapsed,
}: {
  slot: SidebarSlot;
  active: boolean;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <span
        aria-hidden="true"
        className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${
          active ? "bg-primary-foreground" : "bg-primary"
        }`}
      />
    );
  }

  if (slot.kind === "loading") {
    return (
      <Spinner
        size="xs"
        label="Loading"
        variant="muted"
        className="ml-auto shrink-0"
      />
    );
  }

  const baseClasses =
    "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums";

  if (slot.kind === "count") {
    return (
      <span
        className={`${baseClasses} ${
          active
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-primary/10 text-primary"
        }`}
      >
        {formatCount(slot)}
      </span>
    );
  }

  return (
    <span
      className={`${baseClasses} ${
        active
          ? "bg-primary-foreground/20 text-primary-foreground"
          : labelToneClasses[slot.tone ?? "info"]
      }`}
    >
      {slot.value}
    </span>
  );
}

interface NavItemProps {
  link: SidebarLink;
  active: boolean;
  collapsed?: boolean;
  onClose?: () => void;
}

const NavItem = ({ link, active, collapsed, onClose }: NavItemProps) => {
  const { href, label, icon, slot, disabled } = link;

  const sharedClasses = `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
    collapsed ? "justify-center" : "justify-start"
  } ${
    disabled
      ? "pointer-events-none opacity-40"
      : active
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
        : "text-sidebar-foreground hover:bg-inverse"
  }`;

  const inner = (
    <>
      <span
        className={`shrink-0 text-xl ${
          !active && !disabled && "text-muted group-hover:text-primary"
        }`}
      >
        {icon}
      </span>

      {!collapsed && <span className="flex-1 truncate">{label}</span>}

      {slot && <SlotBadge slot={slot} active={active} collapsed={collapsed} />}

      {active && !collapsed && (
        <motion.div
          layoutId="adminActiveSide"
          className="absolute left-0 h-5 w-1 rounded-r-full bg-primary-foreground"
        />
      )}

      {!active && !disabled && !collapsed && !slot && (
        <LuChevronRight className="h-4 w-4 -translate-x-2 text-muted opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      )}
    </>
  );

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        title={collapsed ? label : undefined}
        className={sharedClasses}
      >
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClose}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={sharedClasses}
    >
      {inner}
    </Link>
  );
};

interface SidebarContentProps {
  links: SidebarLink[];
  pathname: string;
  collapsed?: boolean;
  onClose?: () => void;
  onLogout: () => void;
}

const SidebarContent = ({
  links,
  pathname,
  collapsed,
  onClose,
  onLogout,
}: SidebarContentProps) => {
  const groupedLinks = useMemo(() => {
    return links.reduce(
      (acc, link) => {
        const cat = link.category || "General";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(link);
        return acc;
      },
      {} as Record<string, SidebarLink[]>,
    );
  }, [links]);

  return (
    <div className="flex h-[calc(100dvh-90px)] flex-col pr-px">
      <nav
        className={cn(
          "flex-1 space-y-6 overflow-y-auto px-3 pb-4",
          collapsed && "hide-scrollbar",
        )}
      >
        {Object.entries(groupedLinks).map(([category, items]) => (
          <div key={category} className="space-y-1">
            {!collapsed && (
              <h4 className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-muted/60">
                {category}
              </h4>
            )}
            {items.map((link) => {
              const active = link.isActive
                ? link.isActive(pathname)
                : pathname === link.href ||
                  pathname.startsWith(link.href + "/");

              return (
                <NavItem
                  key={link.href}
                  link={link}
                  active={active}
                  collapsed={collapsed}
                  onClose={onClose}
                />
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-border px-4 py-2">
        <button
          onClick={onLogout}
          className={`group flex w-full items-center gap-3 rounded-xl p-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LuLogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

const AdminBrandmark = ({ logoOnly = false }: { logoOnly?: boolean }) => (
  <Link
    href="/dashboard"
    className="flex items-center gap-2 overflow-hidden px-1"
  >
    <div className="relative shrink-0" style={{ width: 50, height: 50 }}>
      <Image
        src="/logo.png"
        alt="Brand logo"
        width={1200}
        height={1200}
        quality={90}
        className="object-contain  transition-shadow duration-300 group-hover:shadow-lg"
      />
    </div>
    {!logoOnly && <span className="truncate text-sm font-semibold">Admin</span>}
  </Link>
);

interface SidebarProps {
  links?: SidebarLink[];
}

export const Sidebar = ({ links: externalLinks }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isLoading, role } = useAuth();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } =
    useSidebar();

  const [summary, setSummary] = useState<AdminLinkData>({});
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (externalLinks) {
      setSummary({});
      setSummaryLoading(false);
      return;
    }

    const controller = new AbortController();
    setSummaryLoading(true);

    fetch(ADMIN_SUMMARY_ENDPOINT, { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<AdminLinkData>) : null))
      .then((d) => {
        if (d) setSummary(d);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") {
          console.error("[AdminSidebar] failed to load summary:", e);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSummaryLoading(false);
      });

    return () => controller.abort();
  }, [externalLinks]);

  const activeLinks = useMemo(
    () =>
      externalLinks ??
      getAdminLinks(role, { ...summary, isLoading: summaryLoading }),
    [externalLinks, summary, summaryLoading],
  );

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const width = collapsed ? "w-sidebar-collapsed" : "w-sidebar-expanded";

  if (isLoading) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-border bg-sidebar-bg lg:flex",
          width,
        )}
      >
        <SidebarSkeleton collapsed={collapsed} />
      </aside>
    );
  }

  return (
    <>
      <div className="lg:hidden">
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-60 bg-background/80 backdrop-blur-sm"
              />

              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 z-70 flex h-dvh w-75 flex-col border-r border-border bg-sidebar-bg shadow-2xl"
              >
                <div className="flex items-center justify-between p-4">
                  <AdminBrandmark logoOnly />
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full p-2 text-muted hover:bg-inverse"
                    aria-label="Close sidebar"
                  >
                    <LuX className="h-6 w-6" />
                  </button>
                </div>

                <SidebarContent
                  links={activeLinks}
                  pathname={pathname}
                  onClose={() => setMobileOpen(false)}
                  onLogout={handleLogout}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      <aside
        className={cn(
          "fixed left-0 top-0 z-70 hidden h-full flex-col border-r border-border bg-sidebar-bg transition-all duration-300 ease-in-out lg:flex",
          width,
        )}
      >
        <div
          className={cn(
            "flex items-center p-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && <AdminBrandmark logoOnly />}
          <button
            onClick={toggleCollapsed}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-inverse"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <LuChevronRight /> : <LuChevronLeft />}
          </button>
        </div>

        <SidebarContent
          links={activeLinks}
          pathname={pathname}
          collapsed={collapsed}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
};

function SidebarSkeleton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex h-full flex-col" aria-hidden="true">
      <div
        className={cn(
          "flex items-center p-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <div className="h-10 w-10 animate-pulse rounded-xl bg-muted/30" />
        {!collapsed && (
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted/30" />
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-hidden px-3 py-2 animate-pulse">
        <div className="space-y-1">
          {!collapsed && (
            <div className="mb-2 ml-4 h-2.5 w-16 rounded bg-muted/30" />
          )}
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonNavRow key={i} collapsed={collapsed} />
          ))}
        </div>

        <div className="space-y-1">
          {!collapsed && (
            <div className="mb-2 ml-4 h-2.5 w-24 rounded bg-muted/30" />
          )}
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonNavRow key={i} collapsed={collapsed} withBadge />
          ))}
        </div>

        <div className="space-y-1">
          {!collapsed && (
            <div className="mb-2 ml-4 h-2.5 w-16 rounded bg-muted/30" />
          )}
          <SkeletonNavRow collapsed={collapsed} />
        </div>
      </div>

      <div className="mt-auto border-t border-border px-4 py-2 animate-pulse">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2.5",
            collapsed && "justify-center",
          )}
        >
          <div className="h-5 w-5 shrink-0 rounded bg-muted/30" />
          {!collapsed && <div className="h-4 w-16 rounded bg-muted/30" />}
        </div>
      </div>
    </div>
  );
}

function SkeletonNavRow({
  collapsed = false,
  withBadge = false,
}: {
  collapsed?: boolean;
  withBadge?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5",
        collapsed ? "justify-center" : "justify-start",
      )}
    >
      <div className="h-5 w-5 shrink-0 rounded bg-muted/30" />
      {!collapsed && (
        <>
          <div className="h-4 max-w-[60%] flex-1 rounded bg-muted/30" />
          {withBadge && (
            <div className="ml-auto h-4 w-7 shrink-0 rounded-full bg-muted/30" />
          )}
        </>
      )}
    </div>
  );
}
