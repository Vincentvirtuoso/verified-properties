import { properties } from "@/data/properties";
import { SavedProperty } from "@/types";
import {
  getSavedEntries,
  seedSavedEntries,
  type SavedEntry,
} from "@/lib/saved-properties-storage";

export type SavedListingRecord = {
  userId: string;
  propertySlug: string;
  savedAt: string;
};

export const dummySavedProperties: SavedListingRecord[] = [
  {
    userId: "user_001",
    propertySlug: "luxury-5-bedroom-detached-duplex-lekki-phase-1",
    savedAt: "2026-04-15T12:00:00Z",
  },
  {
    userId: "user_001",
    propertySlug: "luxury-penthouse-apartment-ikoyi",
    savedAt: "2026-04-28T09:45:00Z",
  },
  {
    userId: "user_002",
    propertySlug: "3-bedroom-serviced-apartment-yaba",
    savedAt: "2026-03-25T10:10:00Z",
  },
  {
    userId: "user_002",
    propertySlug: "retail-shop-tejuosho-market-yaba",
    savedAt: "2026-04-19T14:22:00Z",
  },
  {
    userId: "user_004",
    propertySlug: "4-bedroom-terrace-duplex-wuse-2",
    savedAt: "2026-04-02T11:05:00Z",
  },
  {
    userId: "user_010",
    propertySlug: "smart-4-bedroom-semi-detached-duplex-chevron",
    savedAt: "2026-05-02T08:30:00Z",
  },
  {
    userId: "user_010",
    propertySlug: "smart-automated-duplex-katampe",
    savedAt: "2026-05-15T17:12:00Z",
  },
];

const propertyBySlug = new Map(
  properties.map((property) => [property.slug, property]),
);

function ensureSeeded() {
  if (typeof window === "undefined") return;
  seedSavedEntries(
    dummySavedProperties.map<SavedEntry>(({ propertySlug, savedAt }) => ({
      slug: propertySlug,
      savedAt,
    })),
  );
}

export function getSavedPropertiesForUser(_userId: string): SavedProperty[] {
  if (typeof window === "undefined") return [];

  ensureSeeded();

  return getSavedEntries()
    .map(({ slug, savedAt }) => {
      const property = propertyBySlug.get(slug);
      if (!property) return null;
      return { ...property, savedAt } as SavedProperty;
    })
    .filter((p): p is SavedProperty => p !== null)
    .sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );
}

export function getMockSavedProperties(userId: string): SavedProperty[] {
  return getSavedPropertiesForUser(userId);
}
