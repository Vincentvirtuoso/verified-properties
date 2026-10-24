"use client";

import { useEffect, useState } from "react";
import SavedPropertiesClient from "./SavedPropertiesClient";
import { fetchSavedProperties } from "@affilhomes/shared/supabase";
import { useSavedProperties } from "@/contexts/SavedPropertiesContext";
import type { SavedProperty } from "@affilhomes/shared/types";

export default function SavedPropertiesPage() {
  const { savedIds, isLoaded } = useSavedProperties();
  const [properties, setProperties] = useState<SavedProperty[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSavedProperties()
      .then((rows) => {
        if (!cancelled) setProperties(rows);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Could not load your saved properties.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p
        role="alert"
        className="p-10 text-center font-semibold text-destructive"
      >
        {error}
      </p>
    );
  }

  // Wait for BOTH the DB fetch and the saved-ids context to be ready.
  if (!properties || !isLoaded) return <SavedPropertiesSkeleton />;

  // Pass the full fetched list + reactive savedIds — the client filters.
  return (
    <SavedPropertiesClient
      initialProperties={properties}
      savedIds={savedIds}
    />
  );
}

function SavedPropertiesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="animate-pulse">
        <header className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="h-9 w-56 rounded-lg bg-muted/30 sm:h-10 sm:w-72" />
              <div className="h-4 w-72 max-w-full rounded bg-muted/30 sm:h-5 sm:w-96" />
            </div>

            <div className="h-11 w-36 rounded-full border border-border bg-card" />
          </div>
        </header>

        <section className="mb-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="h-11 w-full rounded-xl border border-border bg-card lg:max-w-md" />

            <div className="hidden h-12 w-72 rounded-xl border border-border bg-card sm:flex" />
            <div className="h-11 w-11 rounded-xl border border-border bg-card sm:hidden" />
          </div>
        </section>

        <div className="mb-5">
          <div className="h-4 w-40 rounded bg-muted/30" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="aspect-4/3 bg-muted/30" />

              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-muted/30" />
                <div className="h-4 w-1/2 rounded bg-muted/30" />
                <div className="flex items-center justify-between pt-1">
                  <div className="h-6 w-24 rounded bg-muted/30" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted/30" />
                    <div className="h-8 w-8 rounded-full bg-muted/30" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}