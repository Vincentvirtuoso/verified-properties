"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LuUser,
  LuLayoutDashboard,
  LuChevronDown,
  LuBuilding2,
  LuLogOut,
  LuUserCheck,
  LuCirclePlus,
} from "react-icons/lu";
import { Button } from "../ui/Button";
import { PopulatedUser, Role } from "@/types";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "../ui/Dropdown";
import { useState } from "react";
import { imageLoader } from "@/utils/helpers";

interface UserMenuProps {
  isAuthenticated: boolean;
  user?: PopulatedUser | null;
  onLogout?: () => void;
}

const ProfileMenu = ({
  user,
  onLogout,
}: {
  user: PopulatedUser;
  onLogout?: () => void;
}) => {
  const isPureViewer =
    user.roles.length === 1 && user.roles.includes(Role.Viewer);
  const isCompanyUser = user.activeRole === Role.Company;

  const navLinks = [
    {
      label: isCompanyUser ? "Company Dashboard" : "Dashboard",
      href: user.activeRole === Role.Viewer ? "/profile" : "/dashboard",
      icon: LuLayoutDashboard,
    },
  ];

  const defaultAvatar = "/placeholder_avatar.png";
  const [userImageSrc, setUserImageSrc] = useState(
    user?.avatar || defaultAvatar,
  );

  const contextActions = [];

  if (isPureViewer) {
    contextActions.push(
      {
        label: "List your Property",
        href: "/onboarding/list-property",
        icon: LuCirclePlus,
      },
      {
        label: "Become an Agent/Landlord",
        href: "/onboarding/become-an-agent-or-landlord",
        icon: LuUserCheck,
      },
      {
        label: "Register Company",
        href: "/onboarding/company",
        icon: LuBuilding2,
      },
    );
  } else {
    if (!user.companyId) {
      contextActions.push({
        label: "Register Company",
        href: "/onboarding/company",
        icon: LuBuilding2,
      });
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/profile"
        title="Your profile"
        className="relative w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs hover:bg-primary/20 hover:scale-105 transition-all cursor-pointer overflow-hidden shrink-0"
      >
        <Image
          src={userImageSrc}
          alt={user.name}
          className="object-cover"
          fill
          sizes="36px"
          loader={imageLoader}
          onError={() => setUserImageSrc(defaultAvatar)}
          priority
        />
      </Link>

      <Dropdown>
        <DropdownTrigger asChild>
          <button className="p-1 rounded-md hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none">
            <LuChevronDown className="w-4 h-4" />
          </button>
        </DropdownTrigger>

        <DropdownContent className="w-60 mt-2 p-1.5">
          <div className="px-2 py-1.5 mb-1 text-xs ">
            <p className="font-semibold text-foreground truncate">
              {user.name}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              {user.email}
            </p>
          </div>
          <DropdownSeparator />

          {navLinks.map(({ href, icon: Icon, label }) => (
            <DropdownItem key={href}>
              <Link
                href={href}
                className="flex items-center gap-2.5 w-full px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span>{label}</span>
              </Link>
            </DropdownItem>
          ))}

          {contextActions.length > 0 && (
            <>
              <DropdownSeparator />
              {contextActions.map(({ href, icon: Icon, label }) => (
                <DropdownItem key={href} className="p-0">
                  <Link
                    href={href}
                    className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-muted-foreground rounded-md transition-colors"
                  >
                    <Icon className="w-4 h-4 text-primary/70" />
                    <span className="font-medium text-xs">{label}</span>
                  </Link>
                </DropdownItem>
              ))}
            </>
          )}
          {onLogout && (
            <>
              <DropdownSeparator />
              <DropdownItem
                onClick={onLogout}
                icon={<LuLogOut className="w-4 h-4" />}
                className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-rose-600 hover:text-rose-700 rounded-md hover:bg-rose-50/50 cursor-pointer transition-colors"
              >
                <span>Log out</span>
              </DropdownItem>
            </>
          )}
        </DropdownContent>
      </Dropdown>
    </div>
  );
};

export function UserMenu({ isAuthenticated, user, onLogout }: UserMenuProps) {
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <ProfileMenu user={user} onLogout={onLogout} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex items-center gap-3">
        <Link href="/login">
          <Button
            variant="ghost"
            size="sm"
            className="font-semibold text-navbar-foreground hover:text-primary"
          >
            Log in
          </Button>
        </Link>
        <Link href="/register">
          <Button
            size="sm"
            className="font-semibold px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            Get Started
          </Button>
        </Link>
      </div>

      <Link
        href="/login"
        className="md:hidden p-2 rounded-full hover:bg-sidebar-hover-bg text-navbar-foreground"
        title="Log in"
      >
        <LuUser className="w-6 h-6" />
      </Link>
    </div>
  );
}
