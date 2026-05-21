"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LuUser,
  LuLayoutDashboard,
  LuChevronDown,
  LuLogOut,
  LuUserCheck,
  LuCirclePlus,
  LuChevronUp,
  LuPlus,
  LuUserRoundPlus,
  LuRepeat,
  LuUserRound,
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
import { useMemo, useState } from "react";
import { imageLoader } from "@/utils/helpers";
import { AiOutlineSwitcher } from "react-icons/ai";
import { Badge } from "../ui";
import RoleIcon from "../ui/RoleIcon";
import { BsBuildingAdd, BsBuildings } from "react-icons/bs";
import { getNavLinks } from "./Navbar";

interface UserMenuProps {
  isAuthenticated: boolean;
  user?: PopulatedUser | null;
  onLogout?: () => void;
  onSwitch: (role: Role, activeRole: Role) => void;
}

const ProfileMenu = ({
  user,
  isAuthenticated,
  onLogout,
  onSwitch,
}: {
  user: PopulatedUser;
  onLogout?: () => void;
  isAuthenticated: boolean;
  onSwitch: (role: Role, activeRole: Role) => void;
}) => {
  const [isMainDropdownOpen, setIsMainDropdownOpen] = useState(false);
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
  const [isSubDropdownOpen1, setIsSubDropdownOpen1] = useState(false);
  const [userImageSrc, setUserImageSrc] = useState(
    user?.avatar || "/placeholder_avatar.png",
  );

  const isPureViewer =
    user.roles.length === 1 && user.roles.includes(Role.Viewer);
  const isCompanyUser = user.activeRole === Role.Company;
  const hasAgentOrLandlordRole = user.roles.some(
    (role) => role === Role.Agent || role === Role.Landlord,
  );
  const hasAgentOrLandlordActiveRole =
    user.activeRole === Role.Agent || user.activeRole === Role.Landlord;

  const switchableRoles = user.roles.filter((role) => role !== user.activeRole);
  const addableRoles = [Role.Agent, Role.Landlord, Role.Viewer].filter(
    (role) => !user.roles.includes(role),
  );

  const navLinks = [
    {
      label: isCompanyUser ? "Company Dashboard" : "Dashboard",
      href: user.activeRole === Role.Viewer ? "/profile" : "/dashboard",
      icon: LuLayoutDashboard,
    },
  ];

  const activeNavLinks = useMemo(
    () => getNavLinks(user?.activeRole, isAuthenticated),
    [user?.activeRole, isAuthenticated],
  );

  navLinks.push(...activeNavLinks);
  const dashboardNavLink = navLinks[0];

  const contextActions = [];
  if (isPureViewer) {
    contextActions.push({
      label: "Become an Agent/Landlord",
      href: "/onboarding/become-an-agent-or-landlord",
      icon: LuUserCheck,
    });
    contextActions.push({
      label: "List your Property",
      href: "/onboarding/list-property",
      icon: LuCirclePlus,
    });
  } else {
  }
  if (!user.companyId) {
    contextActions.push({
      label: "Register Company",
      href: "/onboarding/company",
      icon: LuPlus,
    });
    contextActions.push({
      label: "Register as Developer",
      href: "/onboarding/company",
      icon: LuUserRoundPlus,
    });
  }
  if (hasAgentOrLandlordActiveRole) {
    contextActions.push(
      {
        label: "List a New Property",
        href: "/list-property",
        icon: BsBuildingAdd,
      },
      {
        label: "My Properties",
        href: "/my-listings",
        icon: BsBuildings,
      },
    );
    if (!user.roles.includes(Role.Viewer)) {
      // (Add viewr role) button
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
          onError={() => setUserImageSrc("/placeholder_avatar.png")}
          priority
        />
      </Link>

      <Dropdown onOpenChange={(open) => setIsMainDropdownOpen(open)}>
        <DropdownTrigger asChild>
          <button
            aria-label="Open user menu"
            className="p-1 rounded-md hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
          >
            {isMainDropdownOpen ? (
              <LuChevronUp size={20} />
            ) : (
              <LuChevronDown size={20} />
            )}
          </button>
        </DropdownTrigger>

        <DropdownContent className="w-60 mt-2 p-1">
          <div className="px-2 py-1.5 mb-1 text-xs">
            <p className="font-semibold text-foreground truncate">
              {user.name}
              <Badge className="ml-2">{user.activeRole}</Badge>
            </p>
            <p className="text-muted truncate text-[11px]">{user.email}</p>
          </div>
          <DropdownSeparator />
          <div className="overflow-hidden max-h-[35vh] overflow-y-auto">
            <div className="hidden lg:block">
              <Link href={dashboardNavLink.href}>
                <DropdownItem
                  className="flex items-center gap-2.5 px-2 py-2 rounded-md"
                  icon={
                    <dashboardNavLink.icon className="w-4 h-4 text-primary/80" />
                  }
                >
                  <span className=" text-xs">{dashboardNavLink.label}</span>
                </DropdownItem>
              </Link>
            </div>
            <div className="lg:hidden">
              {navLinks.map(({ href, icon: Icon, label }) => (
                <Link href={href} key={href}>
                  <DropdownItem
                    className="flex items-center gap-2.5 px-2 py-2 rounded-md"
                    icon={<Icon className="w-4 h-4 text-primary/80" />}
                  >
                    <span className=" text-xs">{label}</span>
                  </DropdownItem>
                </Link>
              ))}
            </div>
            {contextActions.length > 0 && (
              <>
                <DropdownSeparator />
                {contextActions.map(({ href, icon: Icon, label }) => (
                  <Link key={href + label} href={href}>
                    <DropdownItem
                      className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-muted-foreground rounded-md transition-colors"
                      icon={<Icon className="w-4 h-4 text-primary/80" />}
                    >
                      <span className="font-medium text-xs">{label}</span>
                    </DropdownItem>
                  </Link>
                ))}
              </>
            )}
          </div>
          {hasAgentOrLandlordRole && switchableRoles.length > 0 && (
            <>
              <DropdownSeparator />
              <Dropdown
                className="w-full"
                placement="bottom-end"
                offset={-3}
                onOpenChange={(open) => setIsSubDropdownOpen(open)}
              >
                <DropdownTrigger asChild>
                  <button className="text-xs gap-2 flex items-center w-full justify-between px-3 py-2 rounded-md group hover:bg-subtle/20 cursor-pointer">
                    <span>
                      <LuRepeat className="inline-flex mr-2 w-4 h-4 text-primary" />
                      <span className="group-hover:text-primary">
                        Switch Role to
                      </span>
                    </span>
                    {isSubDropdownOpen ? (
                      <LuChevronUp size={20} />
                    ) : (
                      <LuChevronDown size={20} />
                    )}
                  </button>
                </DropdownTrigger>
                <DropdownContent className="w-35 mr-1 bg-background">
                  {switchableRoles.map((role) => (
                    <DropdownItem
                      className="text-xs capitalize py-1"
                      icon={<RoleIcon role={role} />}
                      key={role}
                      onClick={() => onSwitch(role, user.activeRole)}
                    >
                      {role}
                    </DropdownItem>
                  ))}
                </DropdownContent>
              </Dropdown>
              <DropdownSeparator />
              <Dropdown
                className="w-full"
                placement="bottom-end"
                offset={-3}
                onOpenChange={(open) => setIsSubDropdownOpen1(open)}
              >
                <DropdownTrigger asChild>
                  <button className="text-xs gap-2 flex items-center w-full justify-between px-3 py-2 rounded-md group hover:bg-subtle/20 cursor-pointer">
                    <div className="flex gap-4 items-center">
                      <div className="relative">
                        <LuUserRound className="w-4 h-4 text-primary" />
                        <span className="absolute top-0 translate-y-1/5 -right-2">
                          <LuPlus className="text-primary text-[10px]" />
                        </span>
                      </div>
                      <span className="group-hover:text-primary">Add Role</span>
                    </div>
                    {isSubDropdownOpen1 ? (
                      <LuChevronUp size={20} />
                    ) : (
                      <LuChevronDown size={20} />
                    )}
                  </button>
                </DropdownTrigger>
                <DropdownContent className="w-35 mr-1 bg-background">
                  {addableRoles.map((role) => (
                    <Link
                      key={role}
                      href={`/add-role?from=${user.activeRole}&to=${role}`}
                    >
                      <DropdownItem
                        className="text-xs capitalize py-1"
                        icon={<RoleIcon role={role} />}
                      >
                        {role}
                      </DropdownItem>
                    </Link>
                  ))}
                </DropdownContent>
              </Dropdown>
            </>
          )}

          {onLogout && (
            <>
              <DropdownSeparator />
              <DropdownItem
                onClick={onLogout}
                icon={<LuLogOut className="w-4 h-4" />}
                className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-rose-600 hover:text-rose-700 rounded-md hover:bg-rose-500/10 cursor-pointer transition-colors"
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

export function UserMenu({
  isAuthenticated,
  user,
  onLogout,
  onSwitch,
}: UserMenuProps) {
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <ProfileMenu
          user={user}
          onLogout={onLogout}
          onSwitch={onSwitch}
          isAuthenticated={isAuthenticated}
        />
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
