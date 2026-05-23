"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { LuX } from "react-icons/lu";

export type TagOverflowItem = {
  label: string;
  color?: string;
  onRemove?: () => void;
};

type TagOverflowProps = {
  items: TagOverflowItem[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
  badgeClassName?: string;
  colorMap?: Record<string, string>;
  onOverflowClick?: () => void;
};

const defaultColorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary ring-primary/20",
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

export function TagOverflow({
  items,
  max = 3,
  size = "sm",
  className,
  badgeClassName,
  colorMap = defaultColorMap,
  onOverflowClick,
}: TagOverflowProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, max);
  const overflowCount = items.length - max;

  const badgeSizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
    if (!expanded && onOverflowClick) onOverflowClick();
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleItems.map((item, idx) => (
        <span
          key={idx}
          className={cn(
            "inline-flex items-center rounded-full ring-1 font-medium shrink-0",
            badgeSizeClasses[size],
            item.color && (colorMap[item.color] ?? ""),
            badgeClassName,
          )}
        >
          {item.label}
          {item.onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                item.onRemove?.();
              }}
              className="ml-1 rounded-full hover:bg-black/10 p-0.5"
            >
              <LuX className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {overflowCount > 0 && !expanded && (
        <span
          onClick={toggleExpand}
          className={cn(
            "inline-flex items-center rounded-full bg-muted/20 ring-1 ring-border shrink-0 cursor-pointer hover:bg-muted/30",
            badgeSizeClasses[size],
            "text-muted font-medium",
            badgeClassName,
          )}
        >
          +{overflowCount} more
        </span>
      )}
      {expanded && items.length > max && (
        <span
          onClick={() => setExpanded(false)}
          className={cn(
            "inline-flex items-center rounded-full bg-muted/20 ring-1 ring-border shrink-0 cursor-pointer hover:bg-muted/30",
            badgeSizeClasses[size],
            "text-muted font-medium",
            badgeClassName,
          )}
        >
          show less
        </span>
      )}
    </div>
  );
}
