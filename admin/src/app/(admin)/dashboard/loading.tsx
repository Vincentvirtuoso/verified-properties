import { Skeleton } from "@affilhomes/shared/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" role="status">
      <span className="sr-only">Loading dashboard…</span>

      <HeaderSkeleton />

      <section
        aria-label="Loading key metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ChartPanelSkeleton />
        </div>
        <div className="min-w-0">
          <ListPanelSkeleton rows={4} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ListPanelSkeleton rows={5} />
        </div>
        <TextPanelSkeleton />
      </section>
    </div>
  );
}


function HeaderSkeleton() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-10 w-44 rounded-lg" />
    </header>
  );
}

function StatCardSkeleton() {
  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function ChartPanelSkeleton() {
  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

function ListPanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <ul className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-3 w-12 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextPanelSkeleton() {
  return (
    <div className="card flex flex-col space-y-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      <Skeleton className="h-4 w-36" />
    </div>
  );
}
