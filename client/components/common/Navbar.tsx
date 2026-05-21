"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LuHousePlus, LuMenu } from "react-icons/lu";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Brandmark } from "./BrandMark";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { IconType } from "react-icons";
import {
  LuBuilding,
  LuGraduationCap,
  LuBriefcase,
  LuLayoutDashboard,
  LuUsers,
} from "react-icons/lu";
import { BsBuildings } from "react-icons/bs";

export interface NavLink {
  href: string;
  label: string;
  icon: IconType;
}

export function getNavLinks(
  role: Role | undefined,
  isAuthenticated: boolean,
): NavLink[] {
  const common: NavLink[] = [
    { href: "/properties?type=sale", label: "Buy", icon: LuHousePlus },
    { href: "/properties?type=rent", label: "Rent", icon: BsBuildings },
  ];

  const academyLink: NavLink = {
    href: "/academy",
    label: "Academy",
    icon: LuGraduationCap,
  };

  if (!isAuthenticated) {
    return [...common, academyLink];
  }

  switch (role) {
    case Role.Viewer:
      return [...common, academyLink];

    case Role.Agent:
      return [
        ...common,
        { href: "/brokers", label: "JV Insist Pro", icon: LuBriefcase },
        academyLink,
      ];

    case Role.Landlord:
    case Role.Developer:
      return [
        ...common,
        { href: "/my-listings", label: "Manage", icon: LuLayoutDashboard },
        academyLink,
      ];

    case Role.Company:
      return [
        ...common,
        { href: "/company/listings", label: "Properties", icon: LuBuilding },
        { href: "/company/team", label: "Team", icon: LuUsers },
        academyLink,
      ];

    default:
      return [...common, academyLink];
  }
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { bannerHeight } = useBannerHeightContext();
  const { toggleOpen, isCollapsed } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };
  const handleSwitchRole = async (role: Role, activeRole: Role) => {
    await switchRole(role, activeRole);
  };

  const activeNavLinks = useMemo(
    () => getNavLinks(user?.activeRole, isAuthenticated),
    [user?.activeRole, isAuthenticated],
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`
        sticky z-40 w-full transition-all duration-500 ease-in-out border-b
        ${
          isScrolled
            ? "bg-navbar-bg/85 backdrop-blur-md shadow-md border-border/50"
            : "bg-navbar-bg border-transparent"
        }
      `}
      style={{
        top: bannerHeight,
        transitionProperty: "top, background-color, border-color, box-shadow",
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center gap-4">
            {!isDesktop && (
              <button
                onClick={toggleOpen}
                className="p-2 -ml-2 rounded-xl hover:bg-sidebar-hover-bg transition-colors active:scale-95 text-navbar-foreground"
                aria-label="Open navigation"
              >
                <LuMenu className="w-6 h-6" />
              </button>
            )}
            <Brandmark taglineOnly={isDesktop && !isCollapsed} />
          </div>

          <div className="hidden lg:flex items-center bg-muted/10 rounded-full px-1 py-1 border border-border">
            {activeNavLinks.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-full transition-all
                    ${
                      isActive
                        ? "bg-background text-primary shadow-sm border border-border"
                        : "text-navbar-foreground/70 hover:text-primary hover:bg-subtle/40"
                    }
                  `}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <UserMenu
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
            onSwitch={handleSwitchRole}
          />
        </div>
      </div>
    </nav>
  );
}
