"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuChevronsLeft, LuChevronsRight, LuX } from "react-icons/lu";

import { NAV_SECTIONS } from "./nav-config";
import { useSidebar } from "./SidebarProvider";

type Props = {
  counts?: Partial<Record<"appeals" | "verification" | "support", number>>;
};

export function Sidebar({ counts = {} }: Props) {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } =
    useSidebar();
  const pathname = usePathname();
  const expanded = !collapsed;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "sidebar z-50 flex flex-col",
          // mobile: fixed drawer
          "fixed inset-y-0 left-0 -translate-x-full transition-transform duration-300",
          mobileOpen && "translate-x-0",
          // desktop: static, part of flex layout
          "lg:static lg:translate-x-0 lg:transition-[width]",
          expanded ? "w-sidebar-expanded" : "w-sidebar-collapsed",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 overflow-hidden px-1"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              A
            </span>
            {expanded && (
              <span className="truncate text-sm font-semibold">Admin</span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 hover:bg-sidebar-hover-bg lg:hidden"
            aria-label="Close sidebar"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i} className="mb-3">
              {section.title && expanded && (
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {section.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  const count = item.badgeKey
                    ? counts[item.badgeKey]
                    : undefined;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={expanded ? undefined : item.label}
                        onClick={() => setMobileOpen(false)}
                        className={[
                          "sidebar-link relative",
                          active && "active",
                          expanded ? "" : "justify-center px-0",
                        ].join(" ")}
                      >
                        <Icon size={18} className="shrink-0" />
                        {expanded && (
                          <>
                            <span className="flex-1 truncate">
                              {item.label}
                            </span>
                            {!!count && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                {count > 99 ? "99+" : count}
                              </span>
                            )}
                          </>
                        )}
                        {!expanded && !!count && (
                          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Desktop collapse */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="mx-2 mb-2 hidden items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-sidebar-hover-bg lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {expanded ? (
            <>
              <LuChevronsLeft size={16} />
              <span>Collapse</span>
            </>
          ) : (
            <LuChevronsRight size={16} />
          )}
        </button>
      </aside>
    </>
  );
}
