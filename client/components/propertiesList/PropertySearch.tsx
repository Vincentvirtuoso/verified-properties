"use client";

import { LuSearch, LuX } from "react-icons/lu";
import type { PropertySearch as PropertySearchState } from "@/hooks/usePropertySearch";
import { SearchSuggestionsPanel } from "./SearchSuggestionsPanel";

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

  const isPanelVisible = showSuggestions && isQueryActive;

  return (
    <div className="mb-6">
      <div className="relative max-w-2xl">
        <form onSubmit={handleSearchSubmit} role="search">
          <div className="relative">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (isQueryActive) setShowSuggestions(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by city, address, property type..."
              role="combobox"
              aria-expanded={isPanelVisible}
              aria-controls="search-suggestions"
              aria-autocomplete="list"
              aria-label="Search properties"
              autoComplete="off"
              className="w-full pl-12 pr-12 py-3 bg-background border border-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm transition-all text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full transition-colors"
                aria-label="Clear search"
              >
                <LuX className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </form>

        {/* Outside-click backdrop, sits *below* the panel */}
        {isPanelVisible && (
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setShowSuggestions(false)}
          />
        )}

        {isPanelVisible && (
          <SearchSuggestionsPanel
            suggestions={suggestions}
            isLoading={isSuggestionsLoading}
            query={debouncedSearchQuery}
            trimmedQuery={searchQuery.trim()}
            onSelect={handleSuggestionClick}
          />
        )}
      </div>
    </div>
  );
}
