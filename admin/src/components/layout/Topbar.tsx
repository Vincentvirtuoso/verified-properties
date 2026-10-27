"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  LuBell,
  LuChevronDown,
  LuExternalLink,
  LuLogOut,
  LuMenu,
  LuMoon,
  LuSearch,
  LuSettings,
  LuSun,
  LuUser,
} from "react-icons/lu";

import { Avatar } from "@affilhomes/shared/ui";
import { adminRoleLabels, cn } from "@affilhomes/shared/utils";
import type { AdminRole } from "@affilhomes/shared/types";

import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

import { titleForPath } from "./nav-config";
import { useSidebar } from "./SidebarProvider";

const iconButton =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg " +
  "text-muted transition-colors duration-150 " +
  "hover:bg-sidebar-hover-bg hover:text-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
  "disabled:pointer-events-none disabled:opacity-50";

const menuItem =
  "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 " +
  "text-sm text-foreground transition-colors " +
  "hover:bg-muted/30 focus-visible:bg-muted/30 " +
  "focus-visible:outline-none";

const popover =
  "absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-xl " +
  "border border-border bg-popover p-1 shadow-xl " +
  "animate-fade-in";

export function Topbar() {
  const { setMobileOpen } = useSidebar();
  const { theme, toggle } = useTheme();
  const { user, logout, role, status } = useAuth();

  const pathname = usePathname();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Connect this to your notifications provider when available.
  const unreadCount = 0;

  const searchRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const closePopovers = useCallback(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, []);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setMenuOpen(false);
      }

      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopovers();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePopovers]);

  useEffect(() => {
    closePopovers();
  }, [pathname, closePopovers]);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) {
      searchRef.current?.focus();
      return;
    }

    closePopovers();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const title = titleForPath(pathname);
  const userName = user?.name ?? "Admin";
  const userEmail = user?.email ?? "";
  const userRole = adminRoleLabels[role as AdminRole] ?? "";

  return (
    <header
      ref={headerRef}
      className="
        sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3
        border-b border-border bg-background/85 px-4
        backdrop-blur-xl supports-backdrop-filter:bg-background/70
        md:px-6
      "
    >
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={iconButton + " lg:hidden"}
        aria-label="Open sidebar"
        disabled={status === "loading"}
      >
        <LuMenu size={20} aria-hidden="true" />
      </button>

      {title && (
        <h1 className="min-w-0 truncate text-base font-semibold tracking-tight">
          {title}
        </h1>
      )}

      <div className="ml-auto flex min-w-0 items-center gap-1.5 md:gap-2">
        <Link
          href="/search"
          className={cn(iconButton, " md:hidden")}
          aria-label="Open search"
        >
          <LuSearch size={18} aria-hidden="true" />
        </Link>

        <form
          role="search"
          onSubmit={onSearch}
          className="relative hidden md:block"
        >
          <LuSearch
            size={16}
            aria-hidden="true"
            className="
              pointer-events-none absolute left-3 top-1/2
              -translate-y-1/2 text-muted
            "
          />

          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search accounts, listings…"
            aria-label="Search accounts and listings"
            className="
              h-9 w-52 rounded-lg border border-border
              bg-secondary/50 pl-9 pr-3 text-sm
              outline-none transition-[background-color,border-color,box-shadow]
              placeholder:text-muted
              hover:bg-secondary/80
              focus:border-ring focus:bg-background focus:ring-2
              focus:ring-ring/20
              [&::-webkit-search-cancel-button]:cursor-pointer
              lg:w-64 lg:pr-16
            "
          />

          <kbd
            aria-hidden="true"
            className="
              pointer-events-none absolute right-2 top-1/2
              hidden -translate-y-1/2 rounded-md border
              border-border bg-background px-1.5 py-0.5
              text-[10px] font-medium text-muted lg:block
            "
          >
            {isMac ? "⌘ K" : "Ctrl K"}
          </kbd>
        </form>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((open) => !open);
              setMenuOpen(false);
            }}
            className={iconButton + " relative"}
            aria-expanded={notifOpen}
            aria-haspopup="dialog"
            aria-controls="topbar-notifications"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          >
            <LuBell size={18} aria-hidden="true" />

            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="
                  absolute right-1 top-1 flex h-4 min-w-4
                  items-center justify-center rounded-full
                  bg-primary px-1 text-[10px] font-semibold
                  text-primary-foreground ring-2 ring-background
                "
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <section
              id="topbar-notifications"
              role="dialog"
              aria-label="Notifications"
              className={cn(popover, " w-80 max-w-[calc(100vw-2rem)]")}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-3">
                <h2 className="text-sm font-semibold">Notifications</h2>

                <span className="text-xs text-muted">{unreadCount} unread</span>
              </div>

              <div
                className="flex flex-col items-center px-5 py-9 text-center"
                aria-live="polite"
              >
                <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-secondary">
                  <LuBell size={20} className="text-muted" aria-hidden="true" />
                </span>

                <p className="text-sm font-medium">You&apos;re all caught up</p>

                <p className="mt-1 text-xs leading-relaxed text-muted">
                  New notifications will appear here.
                </p>
              </div>
            </section>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          className={iconButton}
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          title={theme === "dark" ? "Light theme" : "Dark theme"}
        >
          {theme === "dark" ? (
            <LuSun size={18} aria-hidden="true" />
          ) : (
            <LuMoon size={18} aria-hidden="true" />
          )}
        </button>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(iconButton, " hidden md:inline-flex")}
          aria-label="View public site (opens in a new tab)"
          title="View public site"
        >
          <LuExternalLink size={18} aria-hidden="true" />
        </Link>

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
              setNotifOpen(false);
            }}
            className="
              flex max-w-44 items-center gap-2 rounded-lg
              border border-transparent py-1 pl-1 pr-2
              transition-colors hover:border-border
              hover:bg-sidebar-hover-bg
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-ring
              md:max-w-52
            "
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-controls="topbar-account-menu"
            aria-label={`Account menu for ${userName}`}
          >
            <Avatar size={28} name={userName} fallbackIcon={<LuUser />} />

            <span className="hidden min-w-0 text-left sm:block">
              <span className="block truncate text-xs font-medium leading-4">
                {userName}
              </span>
              <span className="block truncate text-[10px] leading-4 text-muted">
                {userRole || "Administrator"}
              </span>
            </span>

            <LuChevronDown
              size={14}
              aria-hidden="true"
              className={cn(
                "hidden shrink-0 text-muted transition-transform duration-200 md:block ",
                menuOpen ? "rotate-180" : "",
              )}
            />
          </button>

          {menuOpen && (
            <div
              id="topbar-account-menu"
              role="menu"
              aria-label="Account options"
              className={cn(popover, " w-64 max-w-[calc(100vw-2rem)]")}
            >
              <div className="flex items-center gap-3 px-3 py-3">
                <Avatar size={36} name={userName} fallbackIcon={<LuUser />} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{userName}</p>

                  {userEmail && (
                    <p className="truncate text-xs text-muted">{userEmail}</p>
                  )}

                  {userRole && (
                    <p className="mt-1 truncate text-[11px] text-muted">
                      {userRole}
                    </p>
                  )}
                </div>
              </div>

              <div className="my-1 h-px bg-border" />

              <Link
                role="menuitem"
                href="/settings/profile"
                onClick={closePopovers}
                className={menuItem}
              >
                <LuUser size={16} className="text-muted" aria-hidden="true" />
                Profile
              </Link>

              <Link
                role="menuitem"
                href="/settings"
                onClick={closePopovers}
                className={menuItem}
              >
                <LuSettings
                  size={16}
                  className="text-muted"
                  aria-hidden="true"
                />
                Settings
              </Link>

              <div className="my-1 h-px bg-border" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closePopovers();
                  void logout?.();
                }}
                className={cn(
                  menuItem,
                  " text-destructive hover:bg-destructive/10",
                )}
              >
                <LuLogOut size={16} aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
