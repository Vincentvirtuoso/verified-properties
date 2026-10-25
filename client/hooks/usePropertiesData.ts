"use client";

import { useEffect, useState } from "react";
import { fetchActiveProperties } from "@affilhomes/shared/supabase";
import type { PopulatedProperty } from "@affilhomes/shared/types";

export function usePropertiesData() {
  const [properties, setProperties] = useState<PopulatedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchActiveProperties()
      .then((rows) => {
        if (!cancelled) setProperties(rows);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled)
          setError("Could not load properties. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { properties, isLoading, error };
}
