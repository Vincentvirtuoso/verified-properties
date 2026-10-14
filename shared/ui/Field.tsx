"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils";
import { FieldLabel } from "./FieldLabel";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IconType } from "react-icons";

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
>;

export interface FieldProps extends NativeInputProps {
  label?: string;
  name?: string;
  type?: "text" | "email" | "password" | "tel" | "number";
  /** Decorative element rendered inside the input. */
  icon?: IconType;
  iconElement?: ReactNode;
  error?: string;
  /** Classes for the wrapper. */
  className?: string;
  /** Classes for the <input> itself. */
  inputClassName?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  {
    label,
    name,
    type = "text",
    placeholder,
    icon: Icon,
    iconElement,
    required = false,
    error,
    className,
    inputClassName,
    id,
    disabled,
    ...inputProps
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `${name}-${generatedId}`;
  const errorId = `${inputId}-error`;

  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  const IconSlot = iconElement ?? (Icon ? <Icon /> : null);

  const togglePasswordVisibility = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}

      <div className="relative">
        {IconSlot && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:h-4.5 [&_svg]:w-4.5">
            {IconSlot}
          </span>
        )}

        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          name={name ?? undefined}
          type={resolvedType}
          value={inputProps.value}
          defaultValue={inputProps.defaultValue}
          onChange={inputProps.onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground",
            "transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-60",
            (Icon || iconElement) && "pl-10",
            isPassword && "pr-10",
            error &&
              "border-destructive focus:border-destructive focus:ring-destructive",
            inputClassName,
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            onMouseDown={(e) => e.preventDefault()}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
});
