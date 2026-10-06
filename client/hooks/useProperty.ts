"use client";

import { useMemo } from "react";
import {
  ListingPurpose,
  PropertyCategory,
  PropertyDocument,
  PropertyFeature,
  PropertyFilterState,
  PopulatedProperty,
} from "@/types";

export type FilterType = "all" | "deals" | ListingPurpose;

export type SortOption = "newest" | "price-low" | "price-high";
export const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Properties" },
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
  { value: "deals", label: "Deals" },
];

export function useProperty(properties: PopulatedProperty[] = []) {
  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
  ];

  const computed = useMemo(() => {
  const LOCATIONS = [...new Set(properties.map((p) => p.location))].sort();

  const ALL_PROPERTY_TYPES = [...new Set(properties.map((p) => p.type))].sort();
  const ALL_CATEGORIES = [
    ...new Set(properties.map((p) => p.category)),
  ] as PropertyCategory[];
  const ALL_FEATURES = [
    ...new Set(properties.flatMap((p) => p.features ?? [])),
  ] as PropertyFeature[];
  const ALL_DOCUMENTS = [
    ...new Set(properties.flatMap((p) => p.documents ?? [])),
  ] as PropertyDocument[];

  const prices = properties.map((p) => p.price || 0);
  const areas = properties.map((p) => p.area || 0);
  // Fall back to 0 when nothing is listed yet (Math.min([]) is Infinity).
  const PRICE_MIN = prices.length ? Math.min(...prices) : 0;
  const PRICE_MAX = prices.length ? Math.max(...prices) : 0;
  const AREA_MIN = areas.length ? Math.min(...areas) : 0;
  const AREA_MAX = areas.length ? Math.max(...areas) : 0;

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
    documents: [],
  };
  return {
    LOCATIONS,
    ALL_PROPERTY_TYPES,
    ALL_CATEGORIES,
    ALL_FEATURES,
    PRICE_MIN,
    PRICE_MAX,
    AREA_MIN,
    AREA_MAX,
    DEFAULT_FILTERS,
    ALL_DOCUMENTS,
  };
  }, [properties]);

  return { SORT_OPTIONS, ...computed };
}
