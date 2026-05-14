"use client";

import Link from "next/link";
import { LuUser, LuLayoutDashboard } from "react-icons/lu";
import { Button } from "../ui/Button";
import { User } from "@/types";

interface UserMenuProps {
  isAuthenticated: boolean;
  user?: User | null;
}

export function UserMenu({ isAuthenticated, user }: UserMenuProps) {
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        {/* Desktop: dashboard link + clickable avatar */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="font-semibold text-navbar-foreground hover:text-primary gap-2"
            >
              <LuLayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>

          <Link
            href="/profile"
            title="Your profile"
            className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs hover:bg-primary/20 hover:scale-105 transition-transform cursor-pointer overflow-hidden"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              user.name?.charAt(0).toUpperCase() || "U"
            )}
          </Link>
        </div>

        {/* Mobile: compact avatar link to profile (instead of plain user icon) */}
        <Link
          href="/profile"
          className="md:hidden p-1 rounded-full hover:bg-sidebar-hover-bg text-navbar-foreground"
          title="Your profile"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              user.name?.charAt(0).toUpperCase() || "U"
            )}
          </div>
        </Link>
      </div>
    );
  }

  // Unauthenticated state
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

      {/* Mobile login link */}
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