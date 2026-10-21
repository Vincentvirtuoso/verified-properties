"use client";

import Link from "next/link";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  LuChevronDown,
  LuChevronUp,
  LuCirclePlus,
  LuLayoutDashboard,
  LuLogOut,
  LuPlus,
  LuShieldCheck,
  LuUser,
  LuUserCheck,
  LuUserRound,
} from "react-icons/lu";
import { Avatar } from "@affilhomes/shared/ui/Avatar";
import { Badge } from "@affilhomes/shared/ui/Badge";
import { Button } from "@affilhomes/shared/ui/Button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@affilhomes/shared/ui/Dropdown";
import { Spinner } from "@affilhomes/shared/ui/Spinner";
import { PopulatedUser, Role } from "@affilhomes/shared/types";
import RoleIcon from "@/components/ui/RoleIcon";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { UpgradeToProCTA } from "./UpgradeToProCTA";
import { ListNewPropertyIcon } from "@affilhomes/shared/icons/ListNewPropertyIcon";

interface UserMenuProps {
  isAuthenticated: boolean;
  user?: PopulatedUser | null;
  isAdmin?: boolean;
  onLogout?: () => void;
  isLoading: boolean;
}

type MenuLink = {
  label: string;
  href: string;
  icon: IconType;
  external?: boolean;
};

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL;

function getNavLinks(user: PopulatedUser, isAdmin: boolean): MenuLink[] {
  const links: MenuLink[] = [
    user.activeRole === Role.Company
      ? {
          label: "Company Dashboard",
          href: "/company/dashboard",
          icon: LuLayoutDashboard,
        }
      : { label: "Dashboard", href: "/dashboard", icon: LuLayoutDashboard },
  ];

  if (isAdmin && ADMIN_URL) {
    links.push({
      label: "Admin",
      href: ADMIN_URL,
      icon: LuShieldCheck,
      external: true,
    });
  }

  return links;
}

function getContextActions(user: PopulatedUser): MenuLink[] {
  const actions: MenuLink[] = [];
  const isPureViewer =
    user.roles.length === 1 && user.roles.includes(Role.Viewer);

  if (isPureViewer) {
    actions.push(
      {
        label: "Become an Agent",
        href: "/onboarding/become-an-agent",
        icon: LuUserCheck,
      },
      {
        label: "List your Property",
        href: "/list-property",
        icon: LuCirclePlus,
      },
    );
  }

  if (!user.companyId) {
    actions.push({
      label: "Register Company",
      href: "/onboarding/company",
      icon: LuPlus,
    });
  }

  if (user.activeRole === Role.Agent) {
    actions.push({
      label: "List a New Property",
      href: "/list-property",
      icon: ListNewPropertyIcon,
    });
  }

  return actions;
}

function getAddableRoles(user: PopulatedUser): Role[] {
  const canAddAgent =
    user.roles.includes(Role.Viewer) && !user.roles.includes(Role.Agent);
  return canAddAgent ? [Role.Agent] : [];
}

const ProfileMenu = ({
  user,
  isAdmin,
  onLogout,
}: {
  user: PopulatedUser;
  isAdmin: boolean;
  onLogout?: () => void;
}) => {
  const [isMainOpen, setIsMainOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navLinks = getNavLinks(user, isAdmin);
  const contextActions = getContextActions(user);
  const addableRoles = getAddableRoles(user);

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        className="relative w-9 h-9 p-0 rounded-full overflow-hidden shrink-0 border-primary border-2 hover:scale-105 transition-all flex items-center justify-center text-xs"
        onClick={() => setIsProfileOpen(true)}
        title="Your Profile"
      >
        <Avatar src={user.avatar} name={user.name} size={36} priority />
      </Button>

      <Dropdown onOpenChange={setIsMainOpen} placement="bottom-end">
        <DropdownTrigger asChild>
          <button
            aria-label="Open user menu"
            className="p-1 rounded-md hover:bg-muted/30 transition-colors text-muted hover:text-foreground cursor-pointer focus:outline-none"
          >
            {isMainOpen ? (
              <LuChevronUp size={20} />
            ) : (
              <LuChevronDown size={20} />
            )}
          </button>
        </DropdownTrigger>

        <DropdownContent className="w-60 mt-2 p-1">
          <div className="mb-2">
            <div className="px-2 py-1.5 mb-1 text-xs">
              <p className="font-semibold text-foreground truncate">
                {user.name}
                <Badge className="ml-2 capitalize">{user.activeRole}</Badge>
              </p>
              <p className="text-muted truncate text-[11px]">{user.email}</p>
            </div>
            <UpgradeToProCTA variant="compact" />
          </div>

          <DropdownSeparator />

          <div className="overflow-hidden max-h-[35vh] overflow-y-auto">
            <DropdownItem
              className="flex items-center gap-2.5 px-2 py-2 rounded-md"
              onClick={() => setIsProfileOpen(true)}
              icon={<LuUserRound className="w-4 h-4 text-primary/80" />}
            >
              <span className="text-xs">View Profile</span>
            </DropdownItem>

            {navLinks.map(({ href, icon: Icon, label, external }) =>
              !external ? (
                <a href={href} key={href} rel="noopener">
                  <DropdownItem
                    className="flex items-center gap-2.5 px-2 py-2 rounded-md"
                    icon={<Icon className="w-4 h-4 text-primary/80" />}
                  >
                    <span className="text-xs">{label}</span>
                  </DropdownItem>
                </a>
              ) : (
                <Link href={href} key={href}>
                  <DropdownItem
                    className="flex items-center gap-2.5 px-2 py-2 rounded-md"
                    icon={<Icon className="w-4 h-4 text-primary/80" />}
                  >
                    <span className="text-xs">{label}</span>
                  </DropdownItem>
                </Link>
              ),
            )}

            {contextActions.length > 0 && (
              <>
                <DropdownSeparator />
                {contextActions.map(({ href, icon: Icon, label }) => (
                  <Link key={href} href={href}>
                    <DropdownItem
                      className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-foreground rounded-md transition-colors"
                      icon={<Icon className="w-4 h-4 text-primary/80" />}
                    >
                      <span className="font-medium text-xs">{label}</span>
                    </DropdownItem>
                  </Link>
                ))}
              </>
            )}
          </div>

          {addableRoles.length > 0 && (
            <>
              <DropdownSeparator />
              <Dropdown
                className="w-full"
                placement="bottom-end"
                offset={-3}
                onOpenChange={setIsAddRoleOpen}
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
                    {isAddRoleOpen ? (
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

      <ProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export function UserMenu({
  isAuthenticated,
  user,
  isAdmin = false,
  onLogout,
  isLoading,
}: UserMenuProps) {
  if (isLoading) {
    return <UserMenuSkeleton />;
  }

  if (isAuthenticated && user) {
    return <ProfileMenu user={user} isAdmin={isAdmin} onLogout={onLogout} />;
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
        {isLoading ? (
          <Spinner variant="muted" />
        ) : (
          <LuUser className="w-6 h-6" />
        )}
      </Link>
    </div>
  );
}

function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="hidden md:flex items-center gap-3">
        <div className="h-8 w-16 rounded-md bg-muted/30" />
        <div className="h-8 w-28 rounded-md bg-muted/30" />
      </div>

      <div className="md:hidden h-10 w-10 rounded-full bg-muted/30" />
    </div>
  );
}
