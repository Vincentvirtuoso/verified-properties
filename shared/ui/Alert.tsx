import { type ReactNode } from "react";
import { LuCircleAlert } from "react-icons/lu";
import { cn } from "../utils";

export function Alert({
  children,
  onRetry,
  onDismiss,
  className,
}: {
  children: ReactNode;
  className?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <LuCircleAlert
          size={16}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        {children}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md px-2 py-1 text-xs font-medium underline underline-offset-2 hover:bg-destructive/10"
        >
          Try again
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2 py-1 text-xs font-medium underline underline-offset-2 hover:bg-destructive/10"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
