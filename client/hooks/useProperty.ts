"use client";

import { properties } from "@/data/properties";
import {
  PropertyCategory,
  PropertyFeature,
  PropertyFilterState,
} from "@/types";

export type ListingType = "all" | "rent" | "sale";
export type SortOption = "newest" | "price-low" | "price-high";
export function useProperty() {
  const FILTER_OPTIONS: { value: ListingType; label: string }[] = [
    { value: "all", label: "All Properties" },
    { value: "sale", label: "For Sale" },
    { value: "rent", label: "For Rent" },
  ];

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
  ];

  const LOCATIONS = [...new Set(properties.map((p) => p.location))].sort();

  const ALL_PROPERTY_TYPES = [...new Set(properties.map((p) => p.type))].sort();
  const ALL_CATEGORIES = [
    ...new Set(properties.map((p) => p.category)),
  ] as PropertyCategory[];
  const ALL_FEATURES = [
    ...new Set(properties.flatMap((p) => p.features ?? [])),
  ] as PropertyFeature[];

  const AGENTS = [
    ...new Set(properties.map((p) => p.agent?.name).filter(Boolean)),
  ].sort() as string[];

  const PRICE_MIN = Math.min(...properties.map((p) => p.price || 0));
  const PRICE_MAX = Math.max(...properties.map((p) => p.price || 0));
  const AREA_MIN = Math.min(...properties.map((p) => p.area || 0));
  const AREA_MAX = Math.max(...properties.map((p) => p.area || 0));

  const DEFAULT_FILTERS: PropertyFilterState = {
    priceRange: [PRICE_MIN, PRICE_MAX],
    bedrooms: "any",
    bathrooms: "any",
    category: "all",
    type: [],
    features: [],
    location: "all",
    minArea: AREA_MIN,
    maxArea: AREA_MAX,
    agent: "all",
  };
  return {
    FILTER_OPTIONS,
    SORT_OPTIONS,
    LOCATIONS,
    ALL_PROPERTY_TYPES,
    ALL_CATEGORIES,
    ALL_FEATURES,
    AGENTS,
    PRICE_MIN,
    PRICE_MAX,
    AREA_MIN,
    AREA_MAX,
    DEFAULT_FILTERS,
  };
}
