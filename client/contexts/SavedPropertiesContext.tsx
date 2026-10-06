"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchSavedPropertyIds,
  saveProperty,
  unsaveProperty,
} from "@/lib/supabase/savedProperties";

interface SavedPropertiesContextValue {
  savedIds: Set<string>;
  savedCount: number;
  /** True once the signed-in user's saved list has loaded. */
  isLoaded: boolean;
  isSaved: (propertyId: string) => boolean;
  /** Saves or unsaves. Returns false when the user must sign in first. */
  toggleSaved: (propertyId: string) => Promise<boolean>;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextValue | null>(
  null,
);

export function SavedPropertiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?._id ?? null;
  const [loaded, setLoaded] = useState<{ userId: string; ids: Set<string> } | null>(null);
  // Only trust the list if it belongs to the current user.
  const isLoaded = !!userId && loaded?.userId === userId;
  const savedIds = useMemo(
    () => (isLoaded && loaded ? loaded.ids : new Set<string>()),
    [isLoaded, loaded],
  );

  useEffect(() => {
    let cancelled = false;
    if (!userId) return;
    fetchSavedPropertyIds()
      .then((ids) => {
        if (!cancelled) setLoaded({ userId, ids: new Set(ids) });
      })
      .catch((err) => console.error("Failed to load saved properties:", err));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleSaved = useCallback(
    async (propertyId: string) => {
      if (!userId) return false;
      const wasSaved = savedIds.has(propertyId);

      // Optimistic update, rolled back if the request fails.
      const apply = (saved: boolean) =>
        setLoaded((prev) => {
          const next = new Set(prev?.userId === userId ? prev.ids : []);
          if (saved) next.add(propertyId);
          else next.delete(propertyId);
          return { userId, ids: next };
        });

      apply(!wasSaved);
      try {
        if (wasSaved) await unsaveProperty(propertyId);
        else await saveProperty(propertyId);
      } catch (err) {
        console.error("Failed to update saved property:", err);
        apply(wasSaved);
      }
      return true;
    },
    [userId, savedIds],
  );

  const value = useMemo(
    () => ({
      savedIds,
      savedCount: savedIds.size,
      isLoaded,
      isSaved: (id: string) => savedIds.has(id),
      toggleSaved,
    }),
    [savedIds, isLoaded, toggleSaved],
  );

  return (
    <SavedPropertiesContext.Provider value={value}>
      {children}
    </SavedPropertiesContext.Provider>
  );
}

export function useSavedProperties() {
  const ctx = useContext(SavedPropertiesContext);
  if (!ctx) {
    throw new Error(
      "useSavedProperties must be used inside SavedPropertiesProvider",
    );
  }
  return ctx;
}
