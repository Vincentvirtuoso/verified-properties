"use client";

import { useEffect, useRef, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import type { PropertySearch as PropertySearchState } from "@/hooks/usePropertySearch";
import { SearchSuggestionsPanel } from "./SearchSuggestionsPanel";

const PANEL_ID = "property-search-suggestions";

interface PropertySearchProps {
  search: PropertySearchState;
}

export function PropertySearch({ search }: PropertySearchProps) {
  const {
    searchQuery,
    debouncedSearchQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    isQueryActive,
    isSuggestionsLoading,
    handleSearchChange,
    handleSearchSubmit,
    handleSuggestionClick,
    handleSearchKeyDown,
    clearSearch,
  } = search;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const isPanelVisible = showSuggestions && isQueryActive;

  // Close the panel when the user clicks or taps outside the search box.
  useEffect(() => {
    if (!isPanelVisible) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isPanelVisible, setShowSuggestions]);

  // Clear the highlighted row whenever the list changes.
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveIndex(-1);
    handleSearchChange(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const count = suggestions.length;

    if (!isPanelVisible || count === 0) {
      handleSearchKeyDown(e);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % count);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? count - 1 : i - 1));
        break;
      case "Enter":
        // Only intercept Enter when a suggestion is highlighted.
        // Otherwise the form submits as usual.
        if (activeIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[activeIndex]);
          setActiveIndex(-1);
        }
        break;
      default:
        handleSearchKeyDown(e);
    }
  };

  const handleClear = () => {
    clearSearch();
    inputRef.current?.focus();
  };

  return (
    <div className="mb-6">
      <div ref={containerRef} className="relative max-w-2xl">
        <form onSubmit={handleSearchSubmit} role="search">
          <div className="relative">
            <LuSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleChange}
              onFocus={() => {
                if (isQueryActive) setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="City, address or property type"
              role="combobox"
              aria-expanded={isPanelVisible}
              aria-controls={PANEL_ID}
              aria-autocomplete="list"
              aria-activedescendant={
                isPanelVisible && activeIndex >= 0
                  ? `${PANEL_ID}-${activeIndex}`
                  : undefined
              }
              aria-label="Search properties"
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:bg-secondary hover:text-foreground"
              >
                <LuX className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>

        {isPanelVisible && (
          <SearchSuggestionsPanel
            id={PANEL_ID}
            suggestions={suggestions}
            activeIndex={activeIndex}
            isLoading={isSuggestionsLoading}
            query={debouncedSearchQuery.trim()}
            onSelect={handleSuggestionClick}
            onHover={setActiveIndex}
          />
        )}
      </div>
    </div>
  );
}
