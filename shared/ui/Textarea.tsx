"use client";

import { cn } from "../utils";
import {
  useId,
  useRef,
  useEffect,
  TextareaHTMLAttributes,
  CSSProperties,
} from "react";

interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className" | "onChange"
> {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  description?: string;
  maxLength?: number;
  showCount?: boolean;
  /** Initial visible rows. Also the default `minRows` when auto-resizing. */
  rows?: number;
  /** Minimum visible rows when auto-resizing. Defaults to `rows`. */
  minRows?: number;
  /** Maximum visible rows before the textarea starts scrolling. */
  maxRows?: number;
  autoResize?: boolean;
  disabled?: boolean;
  className?: string;
}

const LINE_HEIGHT_REM = 1.625;
const VERTICAL_PADDING_REM = 1.5; // py-3 top + bottom
const DEFAULT_MAX_ROWS = 10;

const rowsToRem = (rows: number) =>
  rows * LINE_HEIGHT_REM + VERTICAL_PADDING_REM;

export function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  description,
  maxLength,
  showCount = !!maxLength,
  rows = 3,
  minRows,
  maxRows,
  autoResize = true,
  disabled = false,
  className,
  style,
  ...props
}: TextareaProps) {
  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const effectiveMinRows = minRows ?? rows;
  const effectiveMaxRows = maxRows ?? DEFAULT_MAX_ROWS;

  useEffect(() => {
    if (!autoResize || !textareaRef.current) return;

    const textarea = textareaRef.current;

    const resize = () => {
      const rootFontSize =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const toPx = (rem: number) => rem * rootFontSize;

      const minPx = toPx(rowsToRem(effectiveMinRows));
      const maxPx = toPx(rowsToRem(effectiveMaxRows));

      textarea.style.height = "auto";
      const natural = textarea.scrollHeight;
      const next = Math.min(Math.max(natural, minPx), maxPx);

      textarea.style.height = `${next}px`;
      // Show a scrollbar only when content overflows maxRows.
      textarea.style.overflowY = natural > maxPx ? "auto" : "hidden";
    };

    resize();
    textarea.addEventListener("input", resize);
    return () => textarea.removeEventListener("input", resize);
  }, [autoResize, value, effectiveMinRows, effectiveMaxRows]);

  const characterCount = value.length;
  const isOverLimit = maxLength ? characterCount > maxLength : false;

  // Inline styles double as an SSR/first-paint fallback — the effect
  // refines the height once mounted.
  const baseStyle: CSSProperties = autoResize
    ? {
        minHeight: `${rowsToRem(effectiveMinRows)}rem`,
        maxHeight: `${rowsToRem(effectiveMaxRows)}rem`,
      }
    : {
        height: `${rowsToRem(rows)}rem`,
        ...(minRows != null && { minHeight: `${rowsToRem(minRows)}rem` }),
        ...(maxRows != null && { maxHeight: `${rowsToRem(maxRows)}rem` }),
      };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div
        className={cn(
          "relative rounded-xl border-2 bg-background transition-all duration-200 pr-1 py-1.5",
          "focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
          error
            ? "border-destructive"
            : "border-border hover:border-muted-foreground/30",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <textarea
          ref={textareaRef}
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          rows={autoResize ? undefined : rows}
          className={cn(
            "block w-full resize-none rounded-xl bg-transparent px-4 py-3",
            "text-sm text-foreground placeholder:text-muted",
            "focus:outline-none",
            "disabled:cursor-not-allowed",
          )}
          style={{ ...baseStyle, ...style }}
          {...props}
        />
      </div>

      <div className="flex items-start justify-between gap-2 min-h-5">
        <div>
          {error && (
            <p className="text-destructive text-xs font-medium flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 shrink-0"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 5a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.25a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
              {error}
            </p>
          )}
          {!error && description && (
            <p className="text-xs text-muted">{description}</p>
          )}
        </div>

        {showCount && (
          <p
            className={cn(
              "text-xs tabular-nums shrink-0",
              isOverLimit
                ? "text-destructive font-medium"
                : "text-muted",
            )}
          >
            {characterCount}
            {maxLength && ` / ${maxLength}`}
          </p>
        )}
      </div>
    </div>
  );
}
