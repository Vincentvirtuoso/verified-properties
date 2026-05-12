import React, { forwardRef, useEffect, useRef } from "react";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { label, error, indeterminate, className = "", disabled, ...props },
    ref,
  ) => {
    const innerRef = useRef<HTMLInputElement>(null);
    const combinedRef = ref || innerRef;

    useEffect(() => {
      if (combinedRef && "current" in combinedRef && combinedRef.current) {
        combinedRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate, combinedRef]);

    return (
      <div className="flex flex-col gap-1">
        <label
          className={`flex items-center gap-2 cursor-pointer ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <input
            type="checkbox"
            ref={combinedRef as React.RefObject<HTMLInputElement>}
            disabled={disabled}
            className={`
              w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20
              disabled:cursor-not-allowed
              ${error ? "border-red-500" : "border-border"}
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />
          {label && <span className="text-sm text-foreground">{label}</span>}
        </label>
        {error && (
          <p id={`${props.id}-error`} className="text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
