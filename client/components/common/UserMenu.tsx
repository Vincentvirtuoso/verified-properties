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
import { Badge } from "../ui";
import RoleIcon from "../ui/RoleIcon";
import { BsBuildingAdd } from "react-icons/bs";
import { getNavLinks } from "./Navbar";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { Avatar } from "../ui/Avatar";

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
  const [isAddRoleDropdownOpen, setIsAddRoleDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [userImageSrc, setUserImageSrc] = useState(
    user?.avatar || "/placeholder_avatar.png",
  );

  const isPureViewer =
    user.roles.length === 1 && user.roles.includes(Role.Viewer);
  const isCompanyUser = user.activeRole === Role.Company;
  const hasAgentRole = user.roles.includes(Role.Agent);
  const isAgentActive = user.activeRole === Role.Agent;


  const canAddAgent = !user.roles.includes(Role.Agent);
  const addableRoles = canAddAgent ? [Role.Agent] : [];

  const navLinks = [
    {
      label: isCompanyUser ? "Company Dashboard" : "Dashboard",
      href: isCompanyUser ? "/company/dashboard" : "/dashboard",
      icon: LuLayoutDashboard,
    },
  ];
  const dashboardNavLink = navLinks[0];

  const contextActions = [];

  if (isPureViewer) {
    contextActions.push({
      label: "Become an Agent",
      href: "/onboarding/become-an-agent",
      icon: LuUserCheck,
    });
    contextActions.push({
      label: "List your Property",
      href: "/onboarding/list-property",
      icon: LuCirclePlus,
    });
  }

  if (!user.companyId) {
    contextActions.push({
      label: "Register Company",
      href: "/onboarding/company",
      icon: LuPlus,
    });
  }

  if (isAgentActive) {
    contextActions.push({
      label: "List a New Property",
      href: "/list-property",
      icon: BsBuildingAdd,
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        className="relative w-9 h-9 p-0 rounded-full overflow-hidden shrink-0 border-primary border-2 hover:scale-105 transition-all flex items-center justify-center text-xs"
        onClick={() => setIsProfileOpen(true)}
        title="Your Profile"
      >
        <Avatar src={user.avatar} name={user.name} size={36} priority/>
      </Button>

      <Dropdown
        onOpenChange={(open) => setIsMainDropdownOpen(open)}
        placement="bottom-end"
      >
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
              <Badge className="ml-2 capitalize">{user.activeRole}</Badge>
            </p>
            <p className="text-muted truncate text-[11px]">{user.email}</p>
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
            <div className="hidden lg:block">
              <Link href={dashboardNavLink.href}>
                <DropdownItem
                  className="flex items-center gap-2.5 px-2 py-2 rounded-md"
                  icon={
                    <dashboardNavLink.icon className="w-4 h-4 text-primary/80" />
                  }
                >
                  <span className="text-xs">{dashboardNavLink.label}</span>
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
                    <span className="text-xs">{label}</span>
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


          {addableRoles.length > 0 && (
            <>
              <DropdownSeparator />
              <Dropdown
                className="w-full"
                placement="bottom-end"
                offset={-3}
                onOpenChange={(open) => setIsAddRoleDropdownOpen(open)}
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
                    {isAddRoleDropdownOpen ? (
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
  onLogout,
  onSwitch,
}: UserMenuProps) {
  if (isAuthenticated && user) {
    return (
      <ProfileMenu
        user={user}
        onLogout={onLogout}
        onSwitch={onSwitch}
        isAuthenticated={isAuthenticated}
      />
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
