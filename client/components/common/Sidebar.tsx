"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuHouse,
  LuSearch,
  LuUser,
  LuSettings,
  LuLogOut,
  LuChevronRight,
  LuChevronLeft,
  LuLayoutDashboard,
  LuHistory,
  LuHeart,
  LuBell,
  LuCircleHelp,
  LuCirclePlus,
  LuUsers,
  LuBriefcase,
} from "react-icons/lu";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { Brandmark } from "./BrandMark";
import { FiBarChart2 } from "react-icons/fi";

export interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  category?: string;
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
      href: "/profile",
      label: "Profile",
      icon: <LuUser />,
      category: "Account",
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: <LuBell />,
      category: "Account",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <LuSettings />,
      category: "Account",
    },
    {
      href: "/help",
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
          href: "/saved-properties",
          label: "Saved Homes",
          icon: <LuHeart />,
          category: "Management",
        },
        {
          href: "/history",
          label: "Recent Views",
          icon: <LuHistory />,
          category: "Management",
        },
        ...commonAccount,
      ];

    case Role.Agent:
      return [
        ...commonExplore,
        { href: "/dashboard", label: "Dashboard", icon: <LuLayoutDashboard /> },
        {
          href: "/my-listings",
          label: "My Listings",
          icon: <LuCirclePlus />,
          category: "Management",
        },
        {
          href: "/saved-properties",
          label: "Saved Homes",
          icon: <LuHeart />,
          category: "Management",
        },
        {
          href: "/history",
          label: "Recent Views",
          icon: <LuHistory />,
          category: "Management",
        },
        ...commonAccount,
      ];

    case Role.Landlord:
    case Role.Developer:
      return [
        ...commonExplore,
        { href: "/dashboard", label: "Dashboard", icon: <LuLayoutDashboard /> },
        {
          href: "/my-listings",
          label: "My Properties",
          icon: <LuCirclePlus />,
          category: "Management",
        },
        {
          href: "/analytics",
          label: "Analytics",
          icon: <FiBarChart2 />,
          category: "Management",
        },
        ...commonAccount,
      ];

    case Role.Company:
      return [
        ...commonExplore,
        {
          href: "/company",
          label: "Company Dashboard",
          icon: <LuLayoutDashboard />,
        },
        {
          href: "/company/listings",
          label: "All Listings",
          icon: <LuCirclePlus />,
          category: "Management",
        },
        {
          href: "/company/team",
          label: "Team",
          icon: <LuUsers />,
          category: "Management",
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
        },
        ...commonAccount,
      ];

    default:
      return [...commonExplore, ...commonAccount];
  }
}

// UI sub‑components
const NavItem = ({
  link,
  isActive,
  collapsed,
  onClose,
}: {
  link: SidebarLink;
  isActive: boolean;
  collapsed?: boolean;
  onClose?: () => void;
}) => (
  <Link
    href={link.href}
    onClick={onClose}
    title={collapsed ? link.label : undefined}
    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
        : "text-sidebar-foreground hover:bg-inverse"
    } ${collapsed ? "justify-center" : "justify-start"}`}
  >
    <span
      className={`text-xl shrink-0 ${!isActive && "text-muted-foreground group-hover:text-primary"}`}
    >
      {link.icon}
    </span>
    {!collapsed && <span className="flex-1 truncate">{link.label}</span>}
    {isActive && !collapsed && (
      <motion.div
        layoutId="activeSide"
        className="absolute left-0 w-1 h-5 bg-primary-foreground rounded-r-full"
      />
    )}
    {!isActive && !collapsed && (
      <LuChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-muted-foreground" />
    )}
  </Link>
);

const SidebarContent = ({
  links,
  pathname,
  collapsed,
  onClose,
  onLogout,
}: {
  links: SidebarLink[];
  pathname: string;
  collapsed?: boolean;
  onClose?: () => void;
  onLogout: () => void;
}) => {
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

  return (
    <div className="flex flex-col h-full pr-px">
      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar"
        style={{ maxHeight: `calc(100vh - ${bannerHeight + 170}px)` }}
      >
        {Object.entries(groupedLinks).map(([category, items]) => (
          <div key={category} className="space-y-1">
            {!collapsed && (
              <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                {category}
              </h4>
            )}
            {items.map((link) => (
              <NavItem
                key={link.href}
                link={link}
                isActive={pathname === link.href}
                collapsed={collapsed}
                onClose={onClose}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-border">
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors group ${collapsed ? "justify-center" : ""}`}
        >
          <LuLogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
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

  // Derive links based on active role, unless an external list is provided
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
          className={`flex items-center px-4 py-6 ${collapsed ? "justify-center" : "justify-between"}`}
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
            <div className="flex items-center justify-between px-6 py-6">
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
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
