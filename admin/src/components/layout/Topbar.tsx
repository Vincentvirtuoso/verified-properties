"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
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

import { Avatar, Button } from "@affilhomes/shared/ui";

import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

import { titleForPath } from "./nav-config";
import { useSidebar } from "./SidebarProvider";

const iconButton =
  "rounded-lg p-2 text-muted transition-colors hover:bg-sidebar-hover-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const menuItem =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:bg-secondary";

export function Topbar() {
  const { setMobileOpen } = useSidebar();
  const { theme, toggle } = useTheme();
  const { user, logout: signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  //- TODO: replace with the real unread count from your notifications source
  const unreadCount = 0;

  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setNotifOpen(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const title = titleForPath(pathname);
  const userName = user?.name ?? "Admin";
  const userEmail = user?.email ?? "";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-6">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`${iconButton} lg:hidden`}
        aria-label="Open sidebar"
      >
        <LuMenu size={20} />
      </button>

      {title && (
        <h1 className="min-w-0 truncate text-base font-semibold">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <Link
          href="/search"
          className={`${iconButton} md:hidden`}
          aria-label="Search"
        >
          <LuSearch size={18} />
        </Link>

        <form
          role="search"
          onSubmit={onSearch}
          className="relative hidden md:block"
        >
          <LuSearch
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts, listings…"
            aria-label="Search accounts and listings"
            className="h-9 w-56 rounded-lg border border-border bg-background pl-9 lg:pr-12 text-sm outline-none transition-shadow placeholder:text-muted focus:ring-2 focus:ring-ring lg:w-72"
          />
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted lg:block"
          >
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </form>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setMenuOpen(false);
            }}
            aria-expanded={notifOpen}
            aria-haspopup="true"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            className={`relative ${iconButton}`}
          >
            <LuBell size={18} />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="animate-fade-in absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-1 shadow-lg"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-semibold">Notifications</span>
              </div>
              <div className="px-3 py-8 text-center text-sm text-muted">
                You&apos;re all caught up.
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          className={iconButton}
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
        >
          {theme === "dark" ? <LuSun size={18} /> : <LuMoon size={18} />}
        </button>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`${iconButton} hidden md:block`}
          aria-label="View public site (opens in a new tab)"
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
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Account menu for ${userName}`}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-sidebar-hover-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar size={24} name={userName} />
            <LuChevronDown
              size={14}
              aria-hidden="true"
              className={`hidden text-muted transition-transform md:block ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="animate-fade-in absolute right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-1 shadow-lg"
            >
              <div className="px-3 py-2">
                <div className="truncate text-sm font-semibold">{userName}</div>
                {userEmail && (
                  <div className="truncate text-xs text-muted">{userEmail}</div>
                )}
              </div>
              <div className="my-1 h-px bg-border" />
              <Link
                role="menuitem"
                href="/settings/profile"
                className={menuItem}
              >
                <LuUser size={16} aria-hidden="true" /> Profile
              </Link>
              <Link role="menuitem" href="/settings" className={menuItem}>
                <LuSettings size={16} aria-hidden="true" /> Settings
              </Link>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                role="menuitem"
                onClick={() => signOut?.()}
                className={`${menuItem} text-destructive`}
              >
                <LuLogOut size={16} aria-hidden="true" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
