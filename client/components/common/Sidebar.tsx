"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuHouse,
  LuSearch,
  LuSettings,
  LuLogOut,
  LuChevronRight,
  LuChevronLeft,
  LuLayoutDashboard,
  LuCircleHelp,
  LuCirclePlus,
  LuUsers,
  LuBriefcase,
  LuMessagesSquare,
  LuBookmark,
} from "react-icons/lu";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { Brandmark } from "./BrandMark";
import { FiBarChart2 } from "react-icons/fi";

type SidebarSlot =
  | { kind: "count"; value: number; max?: number }
  | { kind: "label"; value: string; tone?: "info" | "warning" | "success" };

export interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  category?: string;
  slot?: SidebarSlot;
  isActive?: (pathname: string) => boolean;
  disabled?: boolean;
}

function getRoleLinks(role: Role | undefined): SidebarLink[] {
  if (!role) {
    return [
      { href: "/", label: "Home", icon: <LuHouse /> },
      { href: "/properties", label: "Search Properties", icon: <LuSearch /> },
      { href: "/help", label: "Support", icon: <LuCircleHelp /> },
    ];
  }

  const commonAccount: SidebarLink[] = [
    {
      href: "/support",
      label: "Support",
      icon: <LuCircleHelp />,
      category: "Account",
    },
  ];

  const commonExplore: SidebarLink[] = [
    { href: "/", label: "Home", icon: <LuHouse /> },
    { href: "/properties", label: "Search Properties", icon: <LuSearch /> },
  ];

  switch (role) {
    case Role.Viewer:
      return [
        ...commonExplore,
        {
          href: "/enquiries",
          label: "Enquiries",
          icon: <LuMessagesSquare />,
          category: "Management",
          slot: { kind: "count", value: 2, max: 9 },
        },
        {
          href: "/saved-properties",
          label: "Saved Homes",
          icon: <LuBookmark />,
          category: "Management",
          slot: { kind: "count", value: 7, max: 99 },
        },
        ...commonAccount,
      ];

    case Role.Agent:
      return [
        ...commonExplore,
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: <LuLayoutDashboard />,
        },
        {
          href: "/enquiries",
          label: "Enquiries",
          icon: <LuMessagesSquare />,
          category: "Management",
          slot: { kind: "count", value: 12, max: 99 },
        },
        {
          href: "/my-listings",
          label: "My Listings",
          icon: <LuCirclePlus />,
          category: "Management",
          slot: { kind: "count", value: 4, max: 99 },
        },
        {
          href: "/saved-properties",
          label: "Saved Homes",
          icon: <LuBookmark />,
          category: "Management",
        },
        {
          href: "/analytics",
          label: "Analytics",
          icon: <FiBarChart2 />,
          category: "Management",
          slot: { kind: "label", value: "New", tone: "info" },
        },
        ...commonAccount,
      ];

    case Role.Company:
      return [
        ...commonExplore,
        {
          href: "/company/dashboard",
          label: "Company Dashboard",
          icon: <LuLayoutDashboard />,
        },
        {
          href: "/company/enquiries",
          label: "Enquiries",
          icon: <LuMessagesSquare />,
          category: "Management",
          slot: { kind: "count", value: 23, max: 99 },
        },
        {
          href: "/company/listings",
          label: "All Listings",
          icon: <LuCirclePlus />,
          category: "Management",
          slot: { kind: "count", value: 41, max: 99 },
        },
        {
          href: "/company/team",
          label: "Team",
          icon: <LuUsers />,
          category: "Management",
          slot: { kind: "count", value: 8, max: 99 },
        },
        {
          href: "/company/analytics",
          label: "Analytics",
          icon: <FiBarChart2 />,
          category: "Management",
        },
        {
          href: "/company/jobs",
          label: "Open Roles",
          icon: <LuBriefcase />,
          category: "Management",
          slot: { kind: "label", value: "3", tone: "warning" },
        },
        ...commonAccount,
      ];

    default:
      return [...commonExplore, ...commonAccount];
  }
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
          !active &&
          !disabled &&
          "text-muted-foreground group-hover:text-primary"
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
        <LuChevronRight className="h-4 w-4 -translate-x-2 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
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
        className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-3"
        style={{ maxHeight: `calc(100vh - ${bannerHeight + 170}px)` }}
      >
        {Object.entries(groupedLinks).map(([category, items]) => (
          <div key={category} className="space-y-1">
            {!collapsed && (
              <h4 className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
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
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { bannerHeight } = useBannerHeightContext();
  const { user, logout } = useAuth();

  const activeLinks = useMemo(() => {
    if (externalLinks) return externalLinks;
    return getRoleLinks(user?.activeRole);
  }, [externalLinks, user?.activeRole]);

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
        <div
          className={`flex items-center p-4 ${collapsed ? "justify-center" : "justify-between"}`}
        >
          {!collapsed && <Brandmark logoOnly logoSize={40} />}
          <button
            onClick={onCollapsedChange}
            className="p-2 rounded-lg hover:bg-inverse transition-colors text-muted-foreground"
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
            <div className="flex items-center justify-between p-4">
              <Brandmark logoOnly logoSize={40} />
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-inverse text-muted-foreground"
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
