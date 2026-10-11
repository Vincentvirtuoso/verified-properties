import { cn } from "@/lib/utils";
import Link from "next/link";
import { ButtonHTMLAttributes, forwardRef, ReactNode, RefObject } from "react";
import { LuArrowRight } from "react-icons/lu";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
  href?: string;
  showArrow?: boolean;
  disableFocus?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      asChild = false,
      href,
      showArrow,
      disableFocus = false,
      ...props
    },
    ref,
  ) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 group",
      !disableFocus &&
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
      "active:scale-95",
      {
        "w-full": fullWidth,

        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow":
          variant === "primary",
        "bg-neutral-600 text-secondary-foreground hover:bg-neutral-600/60":
          variant === "secondary",
        "border border-border hover:bg-muted/20 text-foreground bg-background":
          variant === "outline",
        "hover:bg-muted/20 text-foreground": variant === "ghost",
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm":
          variant === "danger",
        "px-3 py-1.5 text-xs gap-1.5": size === "xs",
        "px-4 py-2 text-sm gap-2": size === "sm",
        "px-6 py-2.5 text-base gap-2": size === "md",
        "px-8 py-3 text-lg gap-2.5": size === "lg",
        "px-10 py-4 text-xl gap-3": size === "xl",
      },
      href && "hover:text-primary",
      className,
    );

    if (asChild) {
      return (
        <span
          className={baseStyles}
          ref={ref as RefObject<HTMLElement>}
          {...props}
        >
          {children}
        </span>
      );
    }

    if (href) {
      return (
        <Link href={href}>
          <button
            ref={ref}
            className={baseStyles}
            disabled={disabled || isLoading}
            aria-busy={isLoading}
            aria-disabled={disabled || isLoading}
            {...props}
          >
            {isLoading && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}

            {!isLoading && leftIcon && (
              <span className="inline-flex shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}

            {isLoading && loadingText ? loadingText : children}

            {!isLoading && rightIcon && (
              <span className="inline-flex shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
            {!isLoading && showArrow && (
              <span
                className="inline-flex shrink-0 group-hover:translate-x-0.5 duration-300"
                aria-hidden="true"
              >
                <LuArrowRight />
              </span>
            )}
          </button>
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={baseStyles}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {!isLoading && leftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {isLoading && loadingText ? loadingText : children}

        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "children"> & { icon: ReactNode; label: string }
>(({ icon, label, variant = "ghost", size = "md", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      {...props}
    >
      {icon}
    </Button>
  );
});

IconButton.displayName = "IconButton";
