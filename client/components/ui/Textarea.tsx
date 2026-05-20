"use client";

import { cn } from "@/lib/utils";
import { useId, useRef, useEffect } from "react";

interface TextareaProps {
  label?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  description?: string;
  maxLength?: number;
  showCount?: boolean;
  rows?: number;
  autoResize?: boolean;
  disabled?: boolean;
  className?: string;
}

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
  autoResize = true,
  disabled = false,
  className,
}: TextareaProps) {
  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!autoResize || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    resize();
    textarea.addEventListener("input", resize);
    return () => textarea.removeEventListener("input", resize);
  }, [autoResize, value]);

  const characterCount = value.length;
  const isOverLimit = maxLength ? characterCount > maxLength : false;

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
            "block w-full resize-none rounded-xl bg-transparent px-4 py-3 max-h-72",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none",
            "disabled:cursor-not-allowed",
            !autoResize && "min-h-30",
          )}
          style={
            !autoResize ? { height: `${rows * 1.625 + 1.5}rem` } : undefined
          }
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
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {showCount && (
          <p
            className={cn(
              "text-xs tabular-nums shrink-0",
              isOverLimit
                ? "text-destructive font-medium"
                : "text-muted-foreground",
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
