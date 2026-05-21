"use client";

import { cn } from "@/lib/utils";
import { Role } from "@/types";
import { LuShield } from "react-icons/lu";
import { Button } from "./Button";

export type BadgeVariant =
  | "default"
  | "outline"
  | "premium"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "neutral"
  | "secondary";

const BadgeContent = ({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant: BadgeVariant;
  className?: string;
}) => {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-primary/10 text-primary ring-primary/20",
    outline: "bg-transparent text-muted-foreground ring-border",
    premium:
      "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 ring-amber-400/30 dark:from-amber-900/20 dark:to-yellow-900/20 dark:text-amber-400 dark:ring-amber-400/20",
    success:
      "bg-success/10 text-success ring-success/20 dark:bg-success/20 dark:text-success-foreground",
    warning:
      "bg-warning/10 text-warning ring-warning/20 dark:bg-warning/20 dark:text-warning-foreground",
    info: "bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-info-foreground",
    destructive:
      "bg-destructive/10 text-destructive ring-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground",
    neutral:
      "bg-neutral-100 text-neutral-700 ring-neutral-500/20 dark:bg-neutral-800 dark:text-neutral-300",
    secondary:
      "bg-secondary text-secondary-foreground ring-border dark:bg-secondary dark:text-secondary-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset transition-colors",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};

export function Badge({
  children,
  variant = "default",
  className,
  onClick = undefined,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button onClick={onClick}>
        <BadgeContent className={className} variant={variant}>
          {children}
        </BadgeContent>
      </button>
    );
  }

  return (
    <BadgeContent className={className} variant={variant}>
      {children}
    </BadgeContent>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const roleStyles: Record<Role, string> = {
    [Role.Viewer]: "bg-secondary text-secondary-foreground border-border",
    [Role.Agent]:
      "bg-primary-50 dark:bg-primary-950/40 text-primary border-primary-200/30 dark:border-primary-800/30",
    [Role.Landlord]:
      "bg-primary-100 dark:bg-primary-900/30 text-primary border-primary-300/30 dark:border-primary-700/30",
    [Role.Developer]: "bg-warning/10 text-warning border-warning/20",
    [Role.Company]: "bg-info/10 text-info border-info/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium tracking-wide shadow-sm uppercase ${roleStyles[role]}`}
    >
      {role}
    </span>
  );
}

export function LockedBadge() {
  return (
    <Badge variant="premium" className="shadow-sm">
      <LuShield className="mr-1 h-3 w-3 text-warning" />
      Institutional Account
    </Badge>
  );
}
