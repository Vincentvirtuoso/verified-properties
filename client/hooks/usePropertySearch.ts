"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import type { PopulatedProperty } from "@affilhomes/shared/types";
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_FEATURE_LABELS,
} from "@/utils";

export const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

export function usePropertySearch(properties: PopulatedProperty[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchParam = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const trimmedQuery = searchQuery.trim();
  const isQueryActive = trimmedQuery.length >= MIN_QUERY_LENGTH;
  const isSuggestionsLoading =
    isQueryActive && searchQuery !== debouncedSearchQuery;

  // Hydrate the input from the URL on first load (e.g. deep link).
  useEffect(() => {
    if (searchParam && !searchQuery) setSearchQuery(searchParam);
  }, [searchParam, searchQuery]);

  // Derive suggestions whenever the debounced query or dataset changes.
  useEffect(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();

    if (q.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    const set = new Set<string>();

    properties.forEach((p) => {
      if (p.title?.toLowerCase().includes(q)) set.add(p.title);

      if (p.location.city.toLowerCase().includes(q)) set.add(p.location.city);
      if (p.location.state.toLowerCase().includes(q)) set.add(p.location.state);
      if (p.location.address.toLowerCase().includes(q))
        set.add(p.location.address);

      const typeLabel = PROPERTY_TYPE_LABELS[p.type]?.toLowerCase();
      if (typeLabel?.includes(q)) set.add(PROPERTY_TYPE_LABELS[p.type]);

      const catLabel = PROPERTY_CATEGORY_LABELS[p.category]?.toLowerCase();
      if (catLabel?.includes(q)) set.add(PROPERTY_CATEGORY_LABELS[p.category]);

      p.features?.forEach((f) => {
        const featLabel = PROPERTY_FEATURE_LABELS[f]?.toLowerCase();
        if (featLabel?.includes(q)) set.add(PROPERTY_FEATURE_LABELS[f]);
      });
    });

    setSuggestions(Array.from(set).slice(0, MAX_SUGGESTIONS));
  }, [debouncedSearchQuery, properties]);

  const updateSearchParams = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("search", query);
      else params.delete("search");
      router.push(`/properties?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      setShowSuggestions(value.trim().length >= MIN_QUERY_LENGTH);
      updateSearchParams(value);
    },
    [updateSearchParams],
  );

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setSearchQuery(suggestion);
      updateSearchParams(suggestion);
      setShowSuggestions(false);
    },
    [updateSearchParams],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
        (e.target as HTMLInputElement).blur();
      }
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    updateSearchParams("");
    setSuggestions([]);
    setShowSuggestions(false);
  }, [updateSearchParams]);

  return {
    searchQuery,
    debouncedSearchQuery,
    trimmedQuery,
    isQueryActive,
    isSuggestionsLoading,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    handleSearchChange,
    handleSearchSubmit,
    handleSuggestionClick,
    handleSearchKeyDown,
    clearSearch,
  };
}

export type PropertySearch = ReturnType<typeof usePropertySearch>;
