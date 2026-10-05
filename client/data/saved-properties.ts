import { properties } from "@/data/properties";
import { SavedProperty } from "@/types";

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

export const savedPropertiesByUser: Record<string, SavedProperty[]> =
  dummySavedProperties.reduce<Record<string, SavedProperty[]>>(
    (acc, record) => {
      const property = propertyBySlug.get(record.propertySlug);

      if (!property) return acc;

      (acc[record.userId] ??= []).push({
        ...property,
        savedAt: record.savedAt,
      });

      return acc;
    },
    {},
  );

/**
 * Get the populated saved listings for a given user, newest save first.
 */
export function getSavedPropertiesForUser(
  userId: string,
): SavedProperty[] {
  const list = savedPropertiesByUser[userId] ?? [];

  return [...list].sort(
    (a, b) =>
      new Date(b.savedAt).getTime() -
      new Date(a.savedAt).getTime(),
  );
}

/**
 * Convenience helper for the demo's current user.
 */
export function getMockSavedProperties(
  userId: string,
): SavedProperty[] {
  return getSavedPropertiesForUser(userId);
}
