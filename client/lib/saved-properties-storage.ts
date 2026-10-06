export const SAVED_PROPERTIES_STORAGE_KEY = "saved-properties";
export const SAVED_PROPERTIES_EVENT = "saved-properties-changed";

export type SavedEntry = {
  slug: string;
  savedAt: string;
};

function isSavedEntry(value: unknown): value is SavedEntry {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as SavedEntry).slug === "string" &&
    typeof (value as SavedEntry).savedAt === "string"
  );
}

export function getSavedEntries(): SavedEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SAVED_PROPERTIES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isSavedEntry);
  } catch {
    return [];
  }
}

function writeSavedEntries(entries: SavedEntry[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      SAVED_PROPERTIES_STORAGE_KEY,
      JSON.stringify(entries),
    );
    window.dispatchEvent(new Event(SAVED_PROPERTIES_EVENT));
  } catch {
    /* storage full or disabled — fail silently */
  }
}

export function isPropertySaved(slug: string): boolean {
  return getSavedEntries().some((entry) => entry.slug === slug);
}

export function toggleSavedProperty(slug: string): boolean {
  const entries = getSavedEntries();
  const exists = entries.some((entry) => entry.slug === slug);

  const next = exists
    ? entries.filter((entry) => entry.slug !== slug)
    : [{ slug, savedAt: new Date().toISOString() }, ...entries];

  writeSavedEntries(next);
  return !exists;
}

export function seedSavedEntries(entries: SavedEntry[]) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SAVED_PROPERTIES_STORAGE_KEY)) return;
  writeSavedEntries(entries);
}
