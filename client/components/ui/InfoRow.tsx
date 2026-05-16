"use client";

import React from "react";
import Link from "next/link";
import { LuChevronRight } from "react-icons/lu";

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
};

const badgeVariantClasses: Record<InfoRowBadgeVariant, string> = {
  default: "bg-gray-50 text-gray-700 ring-gray-600/20",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  error: "bg-rose-50 text-rose-700 ring-rose-600/10",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
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
}: InfoRowProps) {
  if (value === null || value === undefined || value === "") return null;

  let displayValue: React.ReactNode = value;
  if (typeof value === "boolean") {
    displayValue = value ? "Yes" : "No";
  }

  const isLink = Boolean(href);

  const content = (
    <div
      className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
        isLink ? "hover:bg-muted/50 active:bg-muted" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground min-w-0">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" />}
        <span className="truncate hidden sm:block">{label}</span>
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0">
        {badge &&
        (typeof displayValue === "string" ||
          typeof displayValue === "number") ? (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeVariantClasses[badgeVariant]}`}
          >
            {displayValue}
          </span>
        ) : React.isValidElement(displayValue) ? (
          displayValue
        ) : (
          <span
            className={`text-sm font-medium text-foreground text-right ${
              mono ? "font-mono tracking-tight" : ""
            }`}
          >
            {displayValue}
          </span>
        )}

        {isLink && (
          <LuChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary group-hover:scale-105 group-hover:translate-x-1.25 transition-all" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}
