import type { ComponentType } from "react";
import {
  LuBadgeCheck,
  LuBookOpen,
  LuLayoutDashboard,
  LuLifeBuoy,
  LuPackage,
  LuScale,
  LuScrollText,
  LuSettings,
  LuUsers,
  LuVideo,
} from "react-icons/lu";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  badgeKey?: "appeals" | "verification" | "support";
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LuLayoutDashboard },
    ],
  },
  {
    title: "Moderation",
    items: [
      { label: "Listings", href: "/listings", icon: LuPackage },
      { label: "Videos", href: "/videos", icon: LuVideo },
      {
        label: "Verification",
        href: "/verification",
        icon: LuBadgeCheck,
        badgeKey: "verification",
      },
      {
        label: "Appeals",
        href: "/appeals",
        icon: LuScale,
        badgeKey: "appeals",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Accounts", href: "/accounts", icon: LuUsers },
      { label: "JV", href: "/jv", icon: LuBookOpen },
      {
        label: "Support",
        href: "/support",
        icon: LuLifeBuoy,
        badgeKey: "support",
      },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Audit", href: "/audit", icon: LuScrollText },
      { label: "Settings", href: "/settings", icon: LuSettings },
    ],
  },
];

export function titleForPath(pathname: string): string | undefined {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/"))
        return item.label;
    }
  }
  return undefined;
}
