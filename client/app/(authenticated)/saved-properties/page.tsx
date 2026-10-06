"use client";

import { useEffect, useState } from "react";
import SavedPropertiesClient from "./SavedPropertiesClient";
import { fetchSavedProperties } from "@/lib/supabase/savedProperties";
import { useSavedProperties } from "@/contexts/SavedPropertiesContext";
import { PageSpinner } from "@/components/ui/Spinner";
import type { SavedProperty } from "@/types";

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
      <p role="alert" className="p-10 text-center font-semibold text-destructive">
        {error}
      </p>
    );
  }
  if (!properties) return <PageSpinner label="Loading saved properties..." />;

  // Hide a listing as soon as it is un-hearted on this page.
  return (
    <SavedPropertiesClient
      properties={
        isLoaded ? properties.filter((p) => savedIds.has(p._id)) : properties
      }
    />
  );
}
