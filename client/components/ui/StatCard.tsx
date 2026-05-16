"use client";

import { cn } from "@/lib/utils";

export type StatCardAccent =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "neutral"
  | "emerald"
  | "amber"
  | "blue"
  | "violet"
  | "rose";

export type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: StatCardAccent;
  className?: string;
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "primary",
  className,
}: StatCardProps) {
  const accentClasses: Record<StatCardAccent, string> = {
    primary: "bg-primary-50 text-primary ring-primary-500/20",
    secondary: "bg-secondary text-secondary-foreground ring-border",
    success: "bg-success/10 text-success ring-success/20",
    warning: "bg-warning/10 text-warning ring-warning/20",
    info: "bg-info/10 text-info ring-info/20",
    destructive: "bg-destructive/10 text-destructive ring-destructive/20",
    neutral: "bg-neutral-100 text-neutral-700 ring-neutral-500/20",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-500/20",
    amber: "bg-amber-50 text-amber-600 ring-amber-500/20",
    blue: "bg-blue-50 text-blue-600 ring-blue-500/20",
    violet: "bg-violet-50 text-violet-600 ring-violet-500/20",
    rose: "bg-rose-50 text-rose-600 ring-rose-500/20",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg ring-1 shrink-0",
          accentClasses[accent],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground truncate">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}
