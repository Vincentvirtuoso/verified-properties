"use client";

import type { ReactNode } from "react";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";

interface PropertiesResultsProps {
  isPending: boolean;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  children: ReactNode; 
}

export function PropertiesResults({
  isPending,
  isLoading,
  error,
  onRetry,
  children,
}: PropertiesResultsProps) {
  if (isPending || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-3xl border border-border bg-muted/20 py-20 text-center"
      >
        <p className="mb-4 font-semibold text-destructive">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-border bg-card px-6 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
