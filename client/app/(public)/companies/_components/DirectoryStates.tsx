import Link from "next/link";
import {
  LuRefreshCw,
  LuSearchX,
  LuTriangleAlert,
  LuUsers,
} from "react-icons/lu";

type ViewMode = "grid" | "list";

export function DirectoryLoading({
  view,
  count = 6,
}: {
  view: ViewMode;
  count?: number;
}) {
  return (
    <div
      role="status"
      aria-label="Loading agents"
      className={
        view === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
      }
    >
      {Array.from({ length: count }).map((_, i) =>
        view === "grid" ? (
          <div
            key={i}
            className="animate-pulse bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="h-48 bg-muted/30" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-2/3 rounded bg-muted/30" />
              <div className="h-4 w-1/2 rounded bg-muted/30" />
              <div className="h-4 w-full rounded bg-muted/30 mt-4" />
              <div className="h-4 w-full rounded bg-muted/30" />
            </div>
          </div>
        ) : (
          <div
            key={i}
            className="animate-pulse flex items-center gap-4 bg-card rounded-xl border border-border p-4"
          >
            <div className="h-20 w-20 shrink-0 rounded-full bg-muted/30" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-1/3 rounded bg-muted/30" />
              <div className="h-4 w-1/4 rounded bg-muted/30" />
            </div>
          </div>
        ),
      )}
      <span className="sr-only">Loading agents…</span>
    </div>
  );
}

export function DirectoryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section
      role="alert"
      className="py-16 text-center bg-card rounded-2xl border border-border"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <LuTriangleAlert className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Something went wrong
      </h3>
      <p className="text-muted mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <LuRefreshCw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </section>
  );
}

export function DirectoryNoAgents() {
  return (
    <section className="text-center py-16 bg-card rounded-2xl border border-border">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <LuUsers className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No agents yet
      </h3>
      <p className="text-muted mb-6">
        Agents will appear here once they join Affilhomes.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Back to home
      </Link>
    </section>
  );
}

export function DirectoryNoResults({ onClear }: { onClear: () => void }) {
  return (
    <section className="text-center py-16 bg-card rounded-2xl border border-border">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <LuSearchX className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No agents match your search
      </h3>
      <p className="text-muted mb-6">
        Try a different name, location, or property type, or clear your filters.
      </p>
      <button
        onClick={onClear}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Clear all filters
      </button>
    </section>
  );
}
