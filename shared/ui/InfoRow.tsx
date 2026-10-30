"use client";

import React from "react";
import Link from "next/link";
import { LuChevronRight } from "react-icons/lu";
import { cn } from "../utils";

export type InfoRowBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info";

export type InfoRowProps = {
  icon?: React.ElementType;
  label: string;
  value: string | number | boolean | React.ReactNode | null | undefined;
  href?: string;
  mono?: boolean;
  badge?: boolean;
  badgeVariant?: InfoRowBadgeVariant;
  className?: string;
  hideLabelOnMobile?: boolean;
};

const badgeVariantClasses: Record<InfoRowBadgeVariant, string> = {
  default: "bg-muted/30 text-secondary-foreground ring-border",
  success: "bg-success/10 text-success ring-success/20 ",
  warning: "bg-warning/10 text-warning ring-warning/20 ",
  error: "bg-destructive/10 text-destructive ring-destructive/20 ",
  info: "bg-info/10 text-info ring-info/20 ",
};

export function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  mono,
  badge,
  badgeVariant = "default",
  className = "",
  hideLabelOnMobile = true,
}: InfoRowProps) {
  if (value === null || value === undefined || value === "") return null;

  const displayValue: React.ReactNode =
    typeof value === "boolean" ? (value ? "Yes" : "No") : value;

  const isLink = Boolean(href);
  const isBadgeable =
    badge &&
    (typeof displayValue === "string" || typeof displayValue === "number");
  const isElement = !isBadgeable && React.isValidElement(displayValue);

  const content = (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        isLink && "hover:bg-muted/10 active:bg-muted",
        className,
      )}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-2.5 text-sm text-muted">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted/70" />}
        <span
          className={cn("truncate", hideLabelOnMobile && "hidden sm:block")}
        >
          {label}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {isBadgeable ? (
          <span
            className={cn(
              "inline-flex min-w-0 max-w-full items-center truncate rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
              badgeVariantClasses[badgeVariant],
            )}
          >
            {displayValue}
          </span>
        ) : isElement ? (
          <span className="min-w-0 truncate">{displayValue}</span>
        ) : (
          <span
            className={cn(
              "min-w-0 truncate text-right text-sm font-medium text-foreground",
              mono && "font-mono tracking-tight",
            )}
          >
            {displayValue}
          </span>
        )}

        {isLink && (
          <LuChevronRight className="h-4 w-4 shrink-0 text-muted/40 transition-all group-hover:translate-x-1.25 group-hover:scale-105 group-hover:text-primary" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </Link>
    );
  }

  return content;
}