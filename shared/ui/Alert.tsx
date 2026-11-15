import { type ReactNode } from "react";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuInfo,
  LuTriangleAlert,
  LuX,
} from "react-icons/lu";

import { cn } from "../utils";

type AlertVariant = "default" | "success" | "warning" | "destructive";

const variants = {
  default: {
    container: "border-border bg-muted/30 text-foreground",
    icon: LuInfo,
    iconColor: "text-muted",
    action: "hover:bg-muted",
  },
  success: {
    container: "border-success/30 bg-success/5 text-foreground",
    icon: LuCircleCheck,
    iconColor: "text-success",
    action: "hover:bg-success/10",
  },
  warning: {
    container: "border-warning/30 bg-warning/5 text-foreground",
    icon: LuTriangleAlert,
    iconColor: "text-warning",
    action: "hover:bg-warning/10",
  },
  destructive: {
    container: "border-destructive/30 bg-destructive/5 text-foreground",
    icon: LuCircleAlert,
    iconColor: "text-destructive",
    action: "hover:bg-destructive/10",
  },
};

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
  icon?: ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  dismissLabel?: string;
}

export function Alert({
  children,
  variant = "destructive",
  className,
  icon,
  onRetry,
  onDismiss,
  retryLabel = "Try again",
  dismissLabel = "Dismiss",
}: AlertProps) {
  const styles = variants[variant];
  const Icon = styles.icon;

  return (
    <div
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        styles.container,
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn("mt-0.5 shrink-0", styles.iconColor)}
          aria-hidden="true"
        >
          {icon ?? <Icon size={17} />}
        </span>

        <div
          className={cn("min-w-0 text-sm leading-relaxed", styles.iconColor)}
        >
          {children}
        </div>
      </div>

      {(onRetry || onDismiss) && (
        <div className="flex shrink-0 items-center gap-1 sm:pl-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                styles.action,
              )}
            >
              {retryLabel}
            </button>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label={dismissLabel}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                styles.action,
              )}
            >
              <LuX size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
