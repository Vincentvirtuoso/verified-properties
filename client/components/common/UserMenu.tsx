"use client";

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
import {
  CompanyRegistration,
  PopulatedUser,
  Role,
} from "@affilhomes/shared/types";
import RoleIcon from "@/components/ui/RoleIcon";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { UpgradeToProCTA } from "./UpgradeToProCTA";
import { ListNewPropertyIcon } from "@affilhomes/shared/icons/ListNewPropertyIcon";
import { useConfirm } from "@/contexts/ConfirmDialog";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

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

function getContextActions(
  user: PopulatedUser,
  registration: CompanyRegistration | null,
): MenuLink[] {
  const actions: MenuLink[] = [];
  const applicationOpen =
    registration?.status === "draft" ||
    registration?.status === "docs_submitted";

  if (!user.companyId && !applicationOpen) {
    actions.push({
      label: "Apply for Partnership",
      href: "/complete-registration?role=company",
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
  const { pendingRegistration } = useAuth();
  const contextActions = getContextActions(user, pendingRegistration);
  const addableRoles = getAddableRoles(user);
  const { confirm } = useConfirm();

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Log out?",
      message: "You'll need to sign in again to access your account.",
      confirmLabel: "Log out",
      cancelLabel: "Stay signed in",
      variant: "danger",
    });

    if (confirmed && onLogout) {
      onLogout();
    }
  };

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
              <AccountStatusNote
                user={user}
                registration={pendingRegistration}
              />
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
                onClick={handleLogout}
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

function AccountStatusNote({
  user,
  registration,
}: {
  user: PopulatedUser;
  registration: CompanyRegistration | null;
}) {
  if (user.activeRole === Role.Company) return null;

  const amber =
    "mt-2 rounded-lg border px-2.5 py-2 text-[11px] leading-relaxed border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-200";
  const rose =
    "mt-2 rounded-lg border px-2.5 py-2 text-[11px] leading-relaxed border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-900/10 dark:text-rose-200";
  const sky =
    "mt-2 rounded-lg border px-2.5 py-2 text-[11px] leading-relaxed border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-900/10 dark:text-sky-200";

  if (registration?.status === "draft") {
    return (
      <div className={amber}>
        <p>
          Your account is a viewer account until your partnership application is
          complete.
        </p>
        <Link
          href="/complete-registration?role=company"
          className="mt-1 inline-block font-semibold underline"
        >
          Finish application
        </Link>
      </div>
    );
  }

  if (registration?.status === "docs_submitted") {
    return (
      <div className={sky}>
        <p>
          Your partnership application is under review. Your account switches to
          a company account once it's approved. Until then it stays a viewer
          account.
        </p>
      </div>
    );
  }

  if (registration?.status === "rejected") {
    return (
      <div className={rose}>
        <p>
          Your partnership application wasn't approved
          {registration.rejectionReason
            ? `: ${registration.rejectionReason}`
            : "."}
        </p>
        <Link
          href="/complete-registration?role=company"
          className="mt-1 inline-block font-semibold underline"
        >
          Update and resubmit
        </Link>
      </div>
    );
  }

  return (
    <p className="mt-2 text-[11px] leading-relaxed text-muted">
      Viewer accounts browse and save listings. Agent and partnership access are
      granted separately.
    </p>
  );
}
