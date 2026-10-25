"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuHouse,
  LuSearch,
  LuLogOut,
  LuChevronRight,
  LuChevronLeft,
  LuLayoutDashboard,
  LuCircleHelp,
  LuUsers,
  LuBriefcase,
  LuMessagesSquare,
  LuBookmark,
  LuClipboardList,
  LuInbox,
  LuPlus,
  LuCreditCard,
} from "react-icons/lu";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@affilhomes/shared/types";
import { Brandmark } from "./BrandMark";
import { FiBarChart2 } from "react-icons/fi";
import { ListingsIcon } from "@affilhomes/shared/icons";
import { ListNewPropertyIcon } from "@affilhomes/shared/icons/ListNewPropertyIcon";
import { cn } from "@/utils";
import { Spinner } from "@affilhomes/shared/ui";

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

function getRoleLinks(
  role: Role | undefined,
  data: RoleLinkData = {},
): SidebarLink[] {
  if (!role) {
    return [
      { href: "/", label: "Home", icon: <LuHouse /> },
      { href: "/properties", label: "Search Properties", icon: <LuSearch /> },
      { href: "/support", label: "Support", icon: <LuCircleHelp /> },
    ];
  }
  const isLoading = !!data.isLoading;

  const count = (
    value: number | null | undefined,
    max = 99,
  ): SidebarSlot | undefined =>
    isLoading ? { kind: "loading" } : countSlot(value, max);

  const commonExplore: SidebarLink[] = [
    { href: "/", label: "Home", icon: <LuHouse /> },
    { href: "/properties", label: "Search Properties", icon: <LuSearch /> },
  ];

  const commonJv: SidebarLink[] = [
    {
      href: "/jv-opportunity",
      label: "JV Opportunities",
      icon: <LuBriefcase />,
      category: "Joint Ventures",
    },
    {
      href: "/jv-opportunity/mine",
      label: "My JV Requests",
      icon: <LuClipboardList />,
      category: "Joint Ventures",
    },
    {
      href: "/jv-opportunity/threads",
      label: "JV Threads",
      icon: <LuInbox />,
      category: "Joint Ventures",
      ...withSlot(count(data.jvThreadsUnread)),
    },
    {
      href: "/jv-opportunity/new",
      label: "Post JV Request",
      icon: <LuPlus />,
      category: "Joint Ventures",
    },
  ];

  const commonTrailing: SidebarLink[] = [
    {
      href: "/subscribe",
      label: "Get JV Access",
      icon: <LuCreditCard />,
      category: "More",
    },
    {
      href: "/support",
      label: "Support",
      icon: <LuCircleHelp />,
      category: "More",
    },
  ];

  switch (role) {
    case Role.Viewer:
      return [
        ...commonExplore,
        ...commonJv,
        {
          href: "/enquiries",
          label: "Enquiries",
          icon: <LuMessagesSquare />,
          category: "Management",
          ...withSlot(count(data.enquiriesCount)),
        },
        {
          href: "/saved-properties",
          label: "Saved Homes",
          icon: <LuBookmark />,
          category: "Management",
          ...withSlot(count(data.savedPropertiesCount)),
        },
        ...commonTrailing,
      ];

    case Role.Agent:
      return [
        ...commonExplore,
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: <LuLayoutDashboard />,
        },
        ...commonJv,
        {
          href: "/enquiries",
          label: "Enquiries",
          icon: <LuMessagesSquare />,
          category: "Management",
          ...withSlot(count(data.enquiriesCount)),
        },
        {
          href: "/my-listings",
          label: "My Listings",
          icon: <ListingsIcon />,
          category: "Management",
          ...withSlot(count(data.listingsCount)),
        },
        {
          href: "/list-property",
          label: "List Property",
          icon: <ListNewPropertyIcon />,
          category: "Management",
          ...withSlot(
            data.draftListingsCount
              ? labelSlot(`Draft (${data.draftListingsCount})`, "warning")
              : undefined,
          ),
        },
        {
          href: "/saved-properties",
          label: "Saved Homes",
          icon: <LuBookmark />,
          category: "Management",
          ...withSlot(count(data.savedPropertiesCount)),
        },
        {
          href: "/analytics",
          label: "Analytics",
          icon: <FiBarChart2 />,
          category: "Management",
          ...withSlot(
            data.analyticsIsNew ? labelSlot("New", "info") : undefined,
          ),
        },
        ...commonTrailing,
      ];

    case Role.Company:
      return [
        ...commonExplore,
        {
          href: "/company/dashboard",
          label: "Company Dashboard",
          icon: <LuLayoutDashboard />,
        },
        ...commonJv,
        {
          href: "/company/enquiries",
          label: "Enquiries",
          icon: <LuMessagesSquare />,
          category: "Management",
          ...withSlot(count(data.enquiriesCount)),
        },
        {
          href: "/company/listings",
          label: "All Listings",
          icon: <ListingsIcon />,
          category: "Management",
          ...withSlot(count(data.listingsCount)),
        },
        {
          href: "/company/team",
          label: "Team",
          icon: <LuUsers />,
          category: "Management",
          ...withSlot(count(data.teamMembersCount)),
        },
        {
          href: "/company/analytics",
          label: "Analytics",
          icon: <FiBarChart2 />,
          category: "Management",
          ...withSlot(
            data.analyticsIsNew ? labelSlot("New", "info") : undefined,
          ),
        },
        {
          href: "/company/jobs",
          label: "Open Roles",
          icon: <LuBriefcase />,
          category: "Management",
          ...withSlot(
            labelSlot(
              data.openRolesCount ? String(data.openRolesCount) : undefined,
              "warning",
            ),
          ),
        },
        ...commonTrailing,
      ];

    default:
      return [...commonExplore, ...commonJv, ...commonTrailing];
  }
}

export type RoleLinkData = {
  enquiriesCount?: number | null;
  savedPropertiesCount?: number | null;
  listingsCount?: number | null;
  draftListingsCount?: number | null;
  teamMembersCount?: number | null;
  openRolesCount?: number | null;
  jvThreadsUnread?: number | null;
  analyticsIsNew?: boolean | null;
  isLoading?: boolean;
};

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
          layoutId="activeSide"
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
  userRole?: Role | undefined;
}

const SidebarContent = ({
  links,
  pathname,
  collapsed,
  onClose,
  onLogout,
  userRole,
}: SidebarContentProps) => {
  const { bannerHeight } = useBannerHeightContext();

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

  const showLogout = userRole !== undefined;

  return (
    <div className="flex h-full flex-col pr-px">
      <nav
        className={cn(
          "flex-1 space-y-6 overflow-y-auto px-3",
          collapsed && "hide-scrollbar",
        )}
        style={{ maxHeight: `calc(100vh - ${bannerHeight + 170}px)` }}
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
                : pathname === link.href;

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

      {showLogout && (
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
      )}
    </div>
  );
};

interface SidebarProps {
  links?: SidebarLink[];
  isOpen?: boolean;
  onClose?: () => void;
  variant?: "persistent" | "overlay" | "collapsible";
  position?: "left" | "right";
  collapsed?: boolean;
  onCollapsedChange?: () => void;
}

export const Sidebar = ({
  links: externalLinks,
  isOpen = false,
  onClose,
  variant = "overlay",
  position = "left",
  collapsed = true,
  onCollapsedChange,
}: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { bannerHeight } = useBannerHeightContext();
  const { user, logout, isLoading } = useAuth();
  const [summary, setSummary] = useState<RoleLinkData>({});
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (externalLinks || !user?._id) {
      setSummary({});
      setSummaryLoading(false);
      return;
    }

    const controller = new AbortController();
    setSummaryLoading(true);

    fetch("/api/summary", { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<RoleLinkData>) : null))
      .then((d) => {
        if (d) setSummary(d);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") {
          console.error("[Sidebar] failed to load summary:", e);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSummaryLoading(false);
      });

    return () => controller.abort();
  }, [externalLinks, user?._id, user?.activeRole, pathname]);

  const activeLinks = useMemo(
    () =>
      externalLinks ??
      getRoleLinks(user?.activeRole, { ...summary, isLoading: summaryLoading }),
    [externalLinks, user?.activeRole, summary, summaryLoading],
  );

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isLeft = position === "left";
  const width = collapsed ? "w-sidebar-collapsed" : "w-sidebar-expanded";

  useEffect(() => {
    if (isOpen && variant === "overlay") {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, variant]);

  if (variant !== "overlay") {
    return (
      <aside
        className={`fixed top-0 ${isLeft ? "left-0" : "right-0"} h-full z-40 hidden lg:flex flex-col bg-sidebar-bg border-border transition-all duration-300 ease-in-out ${isLeft ? "border-r" : "border-l"} ${width}`}
        style={{ paddingTop: bannerHeight }}
      >
        {isLoading ? (
          <SidebarSkeleton
            collapsed={collapsed}
            variant={variant}
            position={position}
          />
        ) : (
          <>
            <div
              className={`flex items-center p-4 ${collapsed ? "justify-center" : "justify-between"}`}
            >
              {!collapsed && <Brandmark logoOnly logoSize={40} />}
              <button
                onClick={onCollapsedChange}
                className="p-2 rounded-lg hover:bg-inverse transition-colors text-muted"
              >
                {collapsed ? <LuChevronRight /> : <LuChevronLeft />}
              </button>
            </div>

            <SidebarContent
              userRole={user?.activeRole}
              links={activeLinks}
              pathname={pathname}
              collapsed={collapsed}
              onLogout={handleLogout}
            />
          </>
        )}
      </aside>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-60"
          />

          <motion.aside
            initial={{ x: isLeft ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isLeft ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${isLeft ? "left-0" : "right-0"} h-full w-75 z-70 bg-sidebar-bg shadow-2xl border-border flex flex-col ${isLeft ? "border-r" : "border-l"}`}
            style={{ paddingTop: bannerHeight }}
          >
            {isLoading ? (
              <SidebarSkeleton variant="overlay" position={position} />
            ) : (
              <>
                <div className="flex items-center justify-between p-4">
                  <Brandmark logoOnly logoSize={40} />
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-inverse text-muted"
                  >
                    <LuX className="w-6 h-6" />
                  </button>
                </div>

                <SidebarContent
                  links={activeLinks}
                  pathname={pathname}
                  onClose={onClose}
                  onLogout={handleLogout}
                  userRole={user?.activeRole}
                />
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

function SidebarSkeleton({
  collapsed = false,
  variant = "overlay",
  position = "left",
}: {
  collapsed?: boolean;
  variant?: "persistent" | "overlay" | "collapsible";
  position?: "left" | "right";
}) {
  const isLeft = position === "left";

  return (
    <aside
      className={`flex h-full flex-col bg-sidebar-bg border-border ${
        isLeft ? "border-r" : "border-l"
      }`}
      aria-hidden="true"
    >
      <div
        className={`flex items-center p-4 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div className="h-10 w-10 rounded-xl bg-muted/30 animate-pulse" />
        {!collapsed && (
          <div className="h-8 w-8 rounded-lg bg-muted/30 animate-pulse" />
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
          className={`flex items-center gap-3 rounded-xl p-2.5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="h-5 w-5 shrink-0 rounded bg-muted/30" />
          {!collapsed && <div className="h-4 w-16 rounded bg-muted/30" />}
        </div>
      </div>
    </aside>
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
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
        collapsed ? "justify-center" : "justify-start"
      }`}
    >
      <div className="h-5 w-5 shrink-0 rounded bg-muted/30" />
      {!collapsed && (
        <>
          <div className="h-4 flex-1 max-w-[60%] rounded bg-muted/30" />
          {withBadge && (
            <div className="ml-auto h-4 w-7 shrink-0 rounded-full bg-muted/30" />
          )}
        </>
      )}
    </div>
  );
}
