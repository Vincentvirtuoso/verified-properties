"use client";

import { cn } from "@/lib/utils";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
type SpinnerVariant = "default" | "gold" | "white" | "muted";

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
  xl: "h-12 w-12 border-4",
};

const VARIANT_CLASSES: Record<SpinnerVariant, string> = {
  default: "border-primary-200 border-t-primary-800",
  gold: "border-amber-200  border-t-amber-500",
  white: "border-white/20 border-t-white",
  muted: "border-border-border border-t-muted",
};

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  className?: string;
}

export function Spinner({
  size = "md",
  variant = "default",
  label = "Loading…",
  className,
}: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <span
        className={cn(
          "animate-spin rounded-full",
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          className,
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-background px-10 py-8 shadow-2xl border border-border animate-pulse">
        <Spinner size="lg" />
        <p className="font-sans text-sm font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}

// export function InlineLoader({
//   rows = 1,
//   className,
// }: {
//   rows?: number;
//   className?: string;
// }) {
//   return (
//     <div className={cn("flex flex-col items-center gap-3 py-10", className)}>
//       <Spinner size="md" variant="default" />
//       {rows > 1 && (
//         <div className="space-y-2 w-48">
//           {Array.from({ length: rows - 1 }).map((_, i) => (
//             <div
//               key={i}
//               className="h-2 rounded-full bg-[var(--color-cream-300)] animate-pulse"
//               style={{ width: `${70 + (i % 2) * 20}%` }}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
