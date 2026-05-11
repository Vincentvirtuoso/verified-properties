"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "react-icons/lu";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";

export interface SidebarLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

const defaultLinks: SidebarLink[] = [
  { href: "/", label: "Home", icon: <LuHouse /> },
  { href: "/properties", label: "Properties", icon: <LuSearch /> },
  { href: "/profile", label: "Profile", icon: <LuUser /> },
  { href: "/settings", label: "Settings", icon: <LuSettings /> },
];

interface SidebarProps {
  links?: SidebarLink[];
  isOpen?: boolean;
  onClose?: () => void;
  variant?: "persistent" | "overlay" | "collapsible";
  position?: "left" | "right";
  collapsed?: boolean;
  onCollapsedChange?: () => void;
}

const SidebarContent = ({
  links,
  pathname,
  onClose,
}: {
  links: SidebarLink[];
  pathname: string;
  onClose?: () => void;
}) => (
  <>
    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 dark:shadow-none"
                : "text-sidebar-foreground hover:bg-sidebar-hover-bg dark:hover:bg-sidebar-hover-bg"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-xl transition-colors ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-sidebar-foreground/60 group-hover:text-primary"
                }`}
              >
                {link.icon}
              </span>
              {link.label}
            </div>
            {!isActive && (
              <LuChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            )}
          </Link>
        );
      })}
    </nav>

    <div className="p-4 mt-auto border-t border-border">
      <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors group">
        <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
          <LuLogOut className="w-5 h-5" />
        </div>
        Logout
      </button>
    </div>
  </>
);

export const Sidebar = ({
  links = defaultLinks,
  isOpen = false,
  onClose,
  variant = "overlay",
  position = "left",
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) => {
  const pathname = usePathname();
  const { bannerHeight } = useBannerHeightContext();
  const isLeft = position === "left";

  useEffect(() => {
    if (isOpen && variant === "overlay") {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen, variant]);

  const sidebarBaseClasses = `
    fixed top-0 ${isLeft ? "left-0" : "right-0"} 
    h-full bg-sidebar-bg flex flex-col
    border-border
    ${isLeft ? "border-r" : "border-l"}
  `;

  if (variant === "persistent") {
    return (
      <aside
        className={`${sidebarBaseClasses} w-sidebar-expanded z-40 hidden lg:flex`}
        style={{ paddingTop: bannerHeight }}
      >
        <div className="px-8 py-7">
          <h2 className="text-xl font-bold tracking-tight text-sidebar-foreground">
            LOGO
          </h2>
        </div>
        <SidebarContent links={links} pathname={pathname} />
      </aside>
    );
  }

  if (variant === "collapsible") {
    const width = collapsed ? "w-sidebar-collapsed" : "w-sidebar-expanded";
    const toggleIcon = collapsed ? <LuChevronRight /> : <LuChevronLeft />;

    return (
      <aside
        className={`fixed top-0 ${isLeft ? "left-0" : "right-0"} 
          h-full ${width} z-40 hidden lg:flex flex-col
          border-r border-border
          bg-sidebar-bg transition-all duration-300 ease-in-out`}
        style={{ paddingTop: bannerHeight }}
      >
        <div className="flex items-center justify-between px-4 py-6">
          {!collapsed && (
            <h2 className="text-xl font-bold tracking-tight text-sidebar-foreground">
              LOGO
            </h2>
          )}
          <button
            onClick={onCollapsedChange}
            className="p-2 rounded-md hover:bg-sidebar-hover-bg transition-colors text-sidebar-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {toggleIcon}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                  ${collapsed ? "justify-center" : "justify-start"}
                  ${
                    isActive
                      ? "bg-sidebar-active-bg text-sidebar-active-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-hover-bg"
                  }`}
                title={collapsed ? link.label : undefined}
              >
                <span className="text-xl shrink-0">{link.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-medium">{link.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-4 mt-auto border-t border-border">
            <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors">
              <LuLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
        {collapsed && (
          <div className="p-4 mt-auto border-t border-border flex justify-center">
            <button className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
              <LuLogOut className="w-5 h-5" />
            </button>
          </div>
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
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-[2px] z-60"
          />

          <motion.aside
            initial={{ x: isLeft ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isLeft ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`${sidebarBaseClasses} w-75 z-70 shadow-xl`}
            style={{ paddingTop: bannerHeight }}
          >
            <div className="flex items-center justify-between px-6 py-6">
              <div>
                <h2 className="text-xl font-black text-sidebar-foreground">
                  LOGO
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-sidebar-hover-bg text-sidebar-foreground transition-colors"
              >
                <LuX className="w-6 h-6" />
              </button>
            </div>

            <SidebarContent
              links={links}
              pathname={pathname}
              onClose={onClose}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
