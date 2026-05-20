"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";
import { LuCheck } from "react-icons/lu";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface RadioGroupProps {
  label?: string;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
  gridClassName?: string;
}

export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  required = false,
  error,
  className,
  gridClassName,
}: RadioGroupProps) {
  const groupId = useId();

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div
        className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", gridClassName)}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const radioId = `${groupId}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={radioId}
              className={cn(
                "group flex flex-col p-5 border-2 rounded-2xl cursor-pointer",
                "transition-all duration-200 ease-out",
                "hover:-translate-y-0.5 hover:shadow-md",
                "focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2 focus-within:ring-offset-background",
                isSelected
                  ? "border-primary bg-muted/20"
                  : "border-border bg-card hover:border-muted/30",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    id={radioId}
                    type="radio"
                    name={name}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onChange(option.value)}
                    required={required}
                    className="peer sr-only"
                  />
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-background"
                        : "border-border group-hover:border-muted-foreground/70",
                    )}
                  >
                    {isSelected && (
                      <div className="w-full h-full bg-primary rounded-full flex items-center justify-center animate-in zoom-in-75 duration-150">
                        <LuCheck className="text-xs text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {option.icon && (
                  <div
                    className={cn(
                      "shrink-0 mt-0.5 transition-colors duration-200",
                      isSelected
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {option.icon}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground text-[15px] block leading-snug">
                    {option.label}
                  </span>
                  {option.description && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="text-destructive text-xs mt-1 pl-1 font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 5a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.25a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
