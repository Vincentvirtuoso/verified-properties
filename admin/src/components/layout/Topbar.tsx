"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LuBell,
  LuChevronDown,
  LuExternalLink,
  LuLogOut,
  LuMenu,
  LuMoon,
  LuPlus,
  LuSearch,
  LuSettings,
  LuSun,
  LuUser,
} from "react-icons/lu";

import { Avatar, Button, Field } from "@affilhomes/shared/ui";

import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

import { titleForPath } from "./nav-config";
import { useSidebar } from "./SidebarProvider";

export function Topbar() {
  const { setMobileOpen } = useSidebar();
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(t))
        setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(t))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const title = titleForPath(pathname);

  return (
    <header className="navbar sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 px-4 md:px-6">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="rounded-lg p-2 hover:bg-sidebar-hover-bg lg:hidden"
        aria-label="Open sidebar"
      >
        <LuMenu size={20} />
      </button>

      {title && <h1 className="truncate text-base font-semibold">{title}</h1>}

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <form onSubmit={onSearch} className="relative hidden md:block">
          <LuSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Field
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts, listings…"
            className="h-9 w-56 rounded-lg border border-border bg-background pl-9 pr-12 text-sm outline-none focus:ring-2 focus:ring-ring lg:w-72"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted lg:block">
            ⌘K
          </kbd>
        </form>

        <Button size="sm" className="hidden md:inline-flex">
          <LuPlus size={16} />
          <span className="ml-1.5">New</span>
        </Button>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setMenuOpen(false);
            }}
            className="relative rounded-lg p-2 hover:bg-sidebar-hover-bg"
            aria-label="Notifications"
          >
            <LuBell size={18} />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
          </button>
          {notifOpen && (
            <div className="animate-fade-in absolute right-0 mt-2 w-80 rounded-xl border border-border bg-popover p-1 shadow-lg">
              <div className="px-3 py-2 text-sm font-semibold">
                Notifications
              </div>
              <div className="px-3 py-8 text-center text-sm text-muted">
                You're all caught up.
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 hover:bg-sidebar-hover-bg"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <LuSun size={18} /> : <LuMoon size={18} />}
        </button>

        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-lg p-2 hover:bg-sidebar-hover-bg md:block"
          aria-label="View site"
        >
          <LuExternalLink size={18} />
        </Link>

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((o) => !o);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-sidebar-hover-bg"
          >
            <Avatar size={20} name={user?.name ?? "Admin"} />
            <LuChevronDown size={14} className="hidden md:block" />
          </button>

          {menuOpen && (
            <div className="animate-fade-in absolute right-0 mt-2 w-60 rounded-xl border border-border bg-popover p-1 shadow-lg">
              <div className="px-3 py-2">
                <div className="truncate text-sm font-semibold">
                  {user?.name ?? "Admin"}
                </div>
                <div className="truncate text-xs text-muted">
                  {user?.email ?? "admin@example.com"}
                </div>
              </div>
              <div className="my-1 h-px bg-border" />
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary"
              >
                <LuUser size={16} /> Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary"
              >
                <LuSettings size={16} /> Settings
              </Link>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-secondary"
              >
                <LuLogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
