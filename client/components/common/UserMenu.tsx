"use client";

import Link from "next/link";
import { LuUser, LuLayoutDashboard } from "react-icons/lu";
import { Button } from "../ui/Button";
import { User } from "@/contexts/AuthContext";

interface UserMenuProps {
  isAuthenticated: boolean;
  user?: User | null;
}

export function UserMenu({ isAuthenticated, user }: UserMenuProps) {
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
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

          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs cursor-pointer hover:bg-primary/20 transition-colors">
            {user?.name?.charAt(0) || "U"}
          </div>
        </div>

        <Link
          href="/dashboard"
          className="md:hidden p-2 rounded-full hover:bg-sidebar-hover-bg text-navbar-foreground"
        >
          <LuUser className="w-6 h-6 text-primary" />
        </Link>
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
            List Property
          </Button>
        </Link>
      </div>

      <Link
        href="/login"
        className="md:hidden p-2 rounded-full hover:bg-sidebar-hover-bg text-navbar-foreground"
      >
        <LuUser className="w-6 h-6" />
      </Link>
    </div>
  );
}
