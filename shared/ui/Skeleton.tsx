export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-border ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-foreground/10 to-transparent" />
    </div>
  );
}
