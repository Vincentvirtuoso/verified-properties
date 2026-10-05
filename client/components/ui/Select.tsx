import React from "react";
import { FieldLabel } from "./FieldLabel";
import { cn } from "@/lib/utils";
import { LuChevronDown } from "react-icons/lu";

export interface SelectOption {
  value: string;
  label: string;
}

export type SelectProps = {
  label?: string;
  options: SelectOption[];
  required?: boolean;
  className?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showPlaceholder?: boolean;
};
const Select = ({
  label,
  options,
  required,
  className,
  error,
  onChange,
  showPlaceholder = true,
}: SelectProps) => {
  return (
    <div>
      {label && (
        <FieldLabel htmlFor={label}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FieldLabel>
      )}
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
          {showPlaceholder && label && <option value="">Select {label}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
          <LuChevronDown className="h-4 w-4" />
        </div>
      </div>
      {error && <p className="text-destructive text-xs mt-1.5">{error}</p>}
    </div>
  );
};

export default Select;
