"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuInfo,
  LuTriangleAlert,
  LuX,
} from "react-icons/lu";
import { cn } from "../utils";

export type CalloutVariant =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export type CalloutPosition =
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";

const VARIANT_STYLES: Record<
  CalloutVariant,
  {
    container: string;
    icon: string;
    title: string;
    description: string;
    accent: string;
  }
> = {
  info: {
    container: "border-info/20 bg-card text-card-foreground",
    icon: "text-info",
    title: "text-foreground",
    description: "text-muted",
    accent: "bg-info",
  },
  success: {
    container: "border-success/20 bg-card text-card-foreground",
    icon: "text-success",
    title: "text-foreground",
    description: "text-muted",
    accent: "bg-success",
  },
  warning: {
    container: "border-warning/25 bg-card text-card-foreground",
    icon: "text-warning",
    title: "text-foreground",
    description: "text-muted",
    accent: "bg-warning",
  },
  danger: {
    container: "border-destructive/20 bg-card text-card-foreground",
    icon: "text-destructive",
    title: "text-foreground",
    description: "text-muted",
    accent: "bg-destructive",
  },
  neutral: {
    container: "border-border bg-card text-card-foreground",
    icon: "text-muted",
    title: "text-foreground",
    description: "text-muted",
    accent: "bg-muted",
  },
};

const DEFAULT_ICONS: Record<CalloutVariant, React.ReactNode> = {
  info: <LuInfo aria-hidden="true" />,
  success: <LuCircleCheck aria-hidden="true" />,
  warning: <LuTriangleAlert aria-hidden="true" />,
  danger: <LuCircleAlert aria-hidden="true" />,
  neutral: <LuInfo aria-hidden="true" />,
};

const POSITION_CLASSES: Record<CalloutPosition, string> = {
  "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6",
  "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6",
  "top-left": "top-4 left-4 sm:top-6 sm:left-6",
  "top-right": "top-4 right-4 sm:top-6 sm:right-6",
};

function getAnimation(position: CalloutPosition) {
  const offset = position.endsWith("left") ? -18 : 18;

  return {
    initial: {
      opacity: 0,
      x: offset,
      scale: 0.96,
      filter: "blur(4px)",
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      x: offset * 0.5,
      scale: 0.98,
      filter: "blur(2px)",
    },
  };
}

export interface CalloutProps {
  /** Controls visibility. No internal timer. */
  open: boolean;

  /** Displays a dismiss button when provided. */
  onClose?: () => void;

  variant?: CalloutVariant;
  position?: CalloutPosition;

  title?: React.ReactNode;

  /** Pass null to hide the default icon. */
  icon?: React.ReactNode | null;

  children: React.ReactNode;

  /** Optional action buttons. */
  actions?: React.ReactNode;

  className?: string;
  zIndex?: number;

  transition?: React.ComponentProps<typeof motion.div>["transition"];

  /** Accessible label for the callout. */
  "aria-label"?: string;
}

export function Callout({
  open,
  onClose,
  variant = "info",
  position = "bottom-left",
  title,
  icon,
  children,
  actions,
  className,
  zIndex = 50,
  transition = {
    type: "spring",
    stiffness: 420,
    damping: 32,
    mass: 0.85,
  },
  "aria-label": ariaLabel,
}: CalloutProps) {
  const [mounted, setMounted] = React.useState(false);

  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const styles = VARIANT_STYLES[variant];

  const resolvedIcon = icon === null ? null : (icon ?? DEFAULT_ICONS[variant]);

  const animation = React.useMemo(() => getAnimation(position), [position]);

  if (!mounted) return null;

  const motionProps = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        ...animation,
        transition,
      };

  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed flex flex-col gap-3",
        "max-h-[calc(100dvh-2rem)]",
        POSITION_CLASSES[position],
      )}
      style={{ zIndex }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {open && (
          <motion.div
            key="callout"
            layout={!shouldReduceMotion}
            {...motionProps}
            role={variant === "danger" ? "alert" : "status"}
            aria-label={ariaLabel}
            aria-live={variant === "danger" ? "assertive" : "polite"}
            aria-atomic="true"
            className={cn(
              "pointer-events-auto relative isolate",
              "flex w-[min(24rem,calc(100vw-2rem))]",
              "overflow-hidden rounded-xl border",
              "shadow-lg shadow-black/6 dark:shadow-black/20",
              "backdrop-blur-xl",
              styles.container,
              className,
            )}
          >
            <div
              aria-hidden="true"
              className={cn("absolute inset-y-0 left-0 w-0.75", styles.accent)}
            />

            <div className="flex min-w-0 flex-1 items-start gap-3 p-4 pl-4.5">
              {resolvedIcon && (
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0",
                    "items-center justify-center rounded-lg",
                    "bg-foreground/4.5",
                    styles.icon,
                  )}
                >
                  {React.isValidElement(resolvedIcon)
                    ? React.cloneElement(
                        resolvedIcon as React.ReactElement<{
                          className?: string;
                        }>,
                        {
                          className: "h-[17px] w-[17px]",
                        },
                      )
                    : resolvedIcon}
                </div>
              )}

              <div className="min-w-0 flex-1 py-0.5">
                {title && (
                  <div
                    className={cn(
                      "text-[13px] font-semibold leading-5",
                      styles.title,
                    )}
                  >
                    {title}
                  </div>
                )}

                <div
                  className={cn(
                    "text-[13px] leading-[1.65]",
                    styles.description,
                    title && "mt-1",
                  )}
                >
                  {children}
                </div>

                {actions && (
                  <div
                    className={cn(
                      "mt-3 flex flex-wrap items-center gap-2",
                      "[&_button]:shrink-0",
                    )}
                  >
                    {actions}
                  </div>
                )}
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Dismiss notification"
                  className={cn(
                    "group -mr-1 -mt-1 flex h-7 w-7 shrink-0",
                    "items-center justify-center rounded-md",
                    "text-muted transition-colors",
                    "hover:bg-secondary hover:text-foreground",
                    "focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                    "focus-visible:ring-offset-2",
                    "focus-visible:ring-offset-card",
                  )}
                >
                  <LuX
                    className="h-4 w-4 transition-transform group-hover:rotate-90"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
