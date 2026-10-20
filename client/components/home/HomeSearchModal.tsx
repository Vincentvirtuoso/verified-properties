"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaTimes,
  FaHistory,
  FaMapMarkerAlt,
  FaFire,
} from "react-icons/fa";
import { Button } from "@affilhomes/shared/ui/Button";

const RECENT_KEY = "affilhomes:recent-searches";
const MAX_RECENT = 5;

const POPULAR_LOCATIONS = [
  "Lekki, Lagos",
  "Ikoyi, Lagos",
  "Victoria Island, Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
];

const POPULAR_SEARCHES = [
  "3 bedroom duplex",
  "Luxury apartments",
  "Land for sale",
  "Short let",
  "Commercial property",
];

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return [];
  }
}

function writeRecent(query: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = readRecent().filter((s) => s !== query);
    const next = [query, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* localStorage may be unavailable (private mode, quota) */
  }
}

interface HomeSearchModalProps {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function HomeSearchModal({
  open,
  onClose,
  initialQuery = "",
}: HomeSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [recent, setRecent] = useState<string[]>([]);
  const mounted = useMounted();

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setRecent(readRecent());
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = useCallback(
    (rawQuery: string) => {
      const trimmed = rawQuery.trim();
      if (!trimmed) return;
      writeRecent(trimmed);
      onClose();
      router.push(`/properties?search=${encodeURIComponent(trimmed)}`);
    },
    [onClose, router],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(query);
  };

  const clearRecent = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(RECENT_KEY);
      } catch {
        /* noop */
      }
    }
    setRecent([]);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="home-search-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-4"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            key="home-search-dialog"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search properties"
            className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="p-3 border-b border-border"
            >
              <div className="flex items-center gap-2 bg-background rounded-xl border border-border px-3 focus-within:border-primary/50 transition-colors">
                <FaSearch className="text-muted shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search properties, locations..."
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted py-3 text-base"
                  aria-label="Property search"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="text-muted hover:text-foreground p-1 rounded-full transition-colors"
                    aria-label="Clear search"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
                <Button type="submit" size="sm" disabled={!query.trim()}>
                  Search
                </Button>
              </div>
            </form>

            <div className="max-h-[55vh] overflow-y-auto p-4 space-y-5">
              {recent.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <FaHistory size={11} /> Recent
                    </h3>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => submit(r)}
                        className="text-sm px-3 py-1.5 rounded-full bg-background border border-border hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <FaMapMarkerAlt size={11} /> Popular locations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => submit(loc)}
                      className="text-sm px-3 py-1.5 rounded-full bg-background border border-border hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <FaFire size={11} /> Popular searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="text-sm px-3 py-1.5 rounded-full bg-background border border-border hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="px-4 py-2.5 border-t border-border text-xs text-muted flex items-center justify-between">
              <span className="hidden sm:inline">
                Press{" "}
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[10px]">
                  Enter
                </kbd>{" "}
                to search
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[10px]">
                  Esc
                </kbd>{" "}
                to close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
