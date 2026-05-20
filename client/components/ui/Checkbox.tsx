"use client";

import React, { forwardRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string | React.ReactNode;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      indeterminate,
      className = "",
      disabled,
      checked,
      ...props
    },
    forwardedRef,
  ) => {
    const innerRef = useRef<HTMLInputElement>(null);

    // Safely combine forwardedRef and local innerRef
    const inputRef = (forwardedRef ||
      innerRef) as React.RefObject<HTMLInputElement>;

    useEffect(() => {
      if (inputRef && "current" in inputRef && inputRef.current) {
        inputRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate, inputRef]);

    return (
      <div className="flex flex-col gap-1.5 select-none">
        <label
          className={cn(
            "flex items-start gap-2.5 cursor-pointer text-sm font-medium text-foreground",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <div className="relative flex items-center h-5">
            <input
              type="checkbox"
              ref={forwardedRef || innerRef}
              disabled={disabled}
              checked={checked}
              className="sr-only peer"
              aria-invalid={!!error}
              aria-describedby={
                error && props.id ? `${props.id}-error` : undefined
              }
              {...props}
            />

            <div
              className={cn(
                "w-4.5 h-4.5 rounded border border-input bg-background flex items-center justify-center transition-all duration-150",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                "peer-checked:bg-primary peer-checked:border-primary text-primary-foreground -mb-1",
                indeterminate &&
                  "bg-primary border-primary text-primary-foreground",
                error &&
                  "border-destructive peer-checked:bg-destructive peer-checked:border-destructive",
                disabled &&
                  "bg-muted border-muted peer-checked:bg-muted-foreground",
                className,
              )}
            >
              {indeterminate ? (
                // Indeterminate Dash Icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="w-3 h-3"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              ) : (
                // Checked Checkmark Icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "w-3 h-3 scale-0 transition-transform duration-150",
                    (checked || props.defaultChecked) && "scale-100",
                  )}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>

          {label && (
            <span className="leading-5 text-muted-foreground peer-checked:text-foreground transition-colors">
              {label}
            </span>
          )}
        </label>

        {error && props.id && (
          <p
            id={`${props.id}-error`}
            className="text-xs font-medium text-destructive pl-7"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
