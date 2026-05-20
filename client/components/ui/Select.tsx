import React from "react";
import { FieldLabel } from "./FieldLabel";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

export type SelectProps = {
  label: string;
  options: SelectOption[];
  required?: boolean;
  className?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};
const Select = ({
  label,
  options,
  required,
  className,
  error,
  onChange,
}: SelectProps) => {
  return (
    <div>
      <FieldLabel htmlFor={label}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      <div className="relative" id={label}>
        <select
          aria-label={label}
          className={cn(
            "bg-background border border-border rounded-xl px-5 py-2.5 text-sm w-full appearance-none pr-10 cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-border/80 transition-colors",
            className,
          )}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {error && <p className="text-destructive text-xs mt-1.5">{error}</p>}
    </div>
  );
};

export default Select;
