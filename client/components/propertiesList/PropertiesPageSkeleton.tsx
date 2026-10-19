import { Skeleton } from "@affilhomes/shared/ui/Skeleton";

export function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-5 space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function FilterSidebarSkeleton() {
  return (
    <aside
      className="hidden lg:block w-full lg:w-72 xl:w-80 shrink-0"
      aria-hidden="true"
    >
      <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
            {i < 3 && <Skeleton className="h-10 w-full rounded-lg" />}
          </div>
        ))}
      </div>
    </aside>
  );
}

export function PropertiesResultsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading properties…</span>

      {/* Results header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Skeleton className="h-5 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full lg:hidden" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Full-page skeleton used as the Suspense fallback in app/properties/page.tsx.
 * Matches the real page's top-level structure so the spinner→content shift
 * becomes skeleton→skeleton→content (and the two skeletons are identical).
 */
export function PropertiesPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading properties…</span>

      <div className="px-4 sm:px-6 py-6 sm:py-10">
        {/* Header tabs / pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>

        {/* Search bar */}
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-24 rounded-xl" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <FilterSidebarSkeleton />
          <div className="flex-1">
            <PropertiesResultsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}