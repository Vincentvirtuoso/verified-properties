"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LuGraduationCap, LuSearch, LuX } from "react-icons/lu";
import {
  BreadcrumbItem,
  Breadcrumbs,
  BreadcrumbSchema,
} from "../common/BreadCrumbs";
import DocumentsIcon from "../icons/DocumentsIcon";

export interface DocumentGroupItem {
  type: string;
  name: string;
  summary: string;
}

export interface DocumentGroup {
  id: string;
  label: string;
  items: DocumentGroupItem[];
}

interface DocumentLibraryProps {
  groups: DocumentGroup[];
  totalCount: number;
  docsPath: string;
}

export function DocumentLibrary({
  groups,
  totalCount,
  docsPath,
}: DocumentLibraryProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");

  const trimmed = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    const result: DocumentGroup[] = [];
    for (const group of groups) {
      if (activeCategory !== "all" && group.id !== activeCategory) continue;

      const items = trimmed
        ? group.items.filter(
            (i) =>
              i.name.toLowerCase().includes(trimmed) ||
              i.summary.toLowerCase().includes(trimmed),
          )
        : group.items;

      if (items.length > 0) {
        result.push({ ...group, items });
      }
    }
    return result;
  }, [groups, trimmed, activeCategory]);

  const visibleCount = filteredGroups.reduce((n, g) => n + g.items.length, 0);
  const hasFilters = trimmed.length > 0 || activeCategory !== "all";

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Academy", href: "/academy", icon: <LuGraduationCap /> },
    { label: "Documents", href: "/academy/documents", icon: <DocumentsIcon /> },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />
      <BreadcrumbSchema items={breadcrumbItems} />

      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Property document guides
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
        Every document you&rsquo;ll encounter in a Nigerian property transaction
        — what it is, what it proves, and the questions to ask before you rely
        on it.
      </p>

      <div className="mt-8 flex items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary/60 transition-colors">
        <LuSearch
          className="text-muted shrink-0"
          size={13}
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents, e.g. 'C of O', 'mortgage', 'survey'…"
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted py-3 text-sm"
          aria-label="Search document guides"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-muted hover:text-foreground p-1 rounded transition-colors"
            aria-label="Clear search"
          >
            <LuX size={12} />
          </button>
        )}
      </div>

      <div
        className="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by category"
      >
        <FilterChip
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        >
          All ({totalCount})
        </FilterChip>
        {groups.map((group) => (
          <FilterChip
            key={group.id}
            active={activeCategory === group.id}
            onClick={() => setActiveCategory(group.id)}
          >
            {group.label} ({group.items.length})
          </FilterChip>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {hasFilters
          ? `${visibleCount} of ${totalCount} guides`
          : `${totalCount} guides`}
      </p>

      <div className="mt-6">
        {filteredGroups.length === 0 ? (
          <EmptyState
            query={query}
            onReset={() => {
              setQuery("");
              setActiveCategory("all");
            }}
          />
        ) : (
          <div className="space-y-10">
            {filteredGroups.map((group) => (
              <section key={group.id} aria-labelledby={`group-${group.id}`}>
                <h2
                  id={`group-${group.id}`}
                  className="text-sm font-semibold uppercase tracking-wider text-muted mb-3"
                >
                  {group.label}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.type}
                      href={`${docsPath}/${item.type}`}
                      className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                    >
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-3">
                        {item.summary}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <aside className="mt-12 rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs leading-relaxed text-muted">
          <strong className="text-foreground">Not legal advice.</strong> These
          guides are general educational content. Document requirements and
          procedures vary by state and by transaction. For a specific property,
          consult a licensed conveyancing lawyer or your state lands registry.
        </p>
      </aside>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted border-border hover:text-foreground hover:border-foreground/30"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({
  query,
  onReset,
}: {
  query: string;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <p className="font-medium text-foreground">
        {query.trim()
          ? `No guides match "${query.trim()}"`
          : "No guides in this category"}
      </p>
      <p className="mt-1 text-sm text-muted">
        Try a different search, or browse all guides.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80"
      >
        Clear filters
      </button>
    </div>
  );
}
