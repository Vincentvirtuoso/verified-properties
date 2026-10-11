export function PropertyCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border animate-pulse">
      <div className="h-64 bg-muted" />
      <div className="p-5 space-y-3">
        <div className="h-7 bg-muted rounded w-2/3" />
        <div className="h-6 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="flex gap-5 mt-5">
          <div className="h-5 bg-muted rounded w-16" />
          <div className="h-5 bg-muted rounded w-16" />
          <div className="h-5 bg-muted rounded w-16" />
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-muted rounded-full" />
              <div className="h-4 bg-muted rounded w-24" />
            </div>
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
