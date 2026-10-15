"use client";

import { LuLoaderCircle, LuSearch } from "react-icons/lu";

interface SearchSuggestionsPanelProps {
  suggestions: string[];
  isLoading: boolean;
  query: string;
  trimmedQuery: string;
  onSelect: (suggestion: string) => void;
}

export function SearchSuggestionsPanel({
  suggestions,
  isLoading,
  query,
  trimmedQuery,
  onSelect,
}: SearchSuggestionsPanelProps) {
  return (
    <div
      id="search-suggestions"
      role="listbox"
      aria-label="Search suggestions"
      className="absolute z-50 mt-2 w-full max-w-2xl bg-popover rounded-xl border border-border shadow-lg overflow-hidden animate-in fade-in-0 slide-in-from-top-1 duration-150"
    >
      {isLoading ? (
        <SuggestionLoader />
      ) : suggestions.length > 0 ? (
        <>
          <div className="max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-secondary focus:bg-secondary focus:outline-none transition-colors border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <LuSearch className="w-4 h-4 text-muted shrink-0" />
                  <span className="text-popover-foreground truncate">
                    {highlightMatch(suggestion, query)}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <SuggestionFooter />
        </>
      ) : (
        <SuggestionEmpty query={trimmedQuery} />
      )}
    </div>
  );
}

function SuggestionLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 px-4 py-6 text-sm text-muted"
    >
      <LuLoaderCircle className="w-4 h-4 animate-spin" aria-hidden="true" />
      <span>Searching…</span>
    </div>
  );
}

function SuggestionEmpty({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-6 py-8 text-center">
      <LuSearch className="w-5 h-5 text-muted" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">No matches found</p>
      <p className="text-xs text-muted max-w-xs">
        We couldn&apos;t find anything for{" "}
        <span className="font-medium text-foreground">&quot;{query}&quot;</span>
        . Try a different city, address, or property type.
      </p>
    </div>
  );
}

function SuggestionFooter() {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        Press
        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
          Enter
        </kbd>
        to see all results
      </span>
      <span className="hidden sm:flex items-center gap-1.5">
        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
          Esc
        </kbd>
        to dismiss
      </span>
    </div>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-primary/20 text-primary font-medium">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
