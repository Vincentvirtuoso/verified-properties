"use client";

import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { FieldLabel } from "./FieldLabel";

interface FieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "tel";
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: IconType;
  required?: boolean;
  error?: string;
  className?: string;
}

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  required = false,
  error,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon size={18} />
          </div>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={cn(
            "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all",
            Icon && "pl-10",
            error &&
              "border-destructive focus:border-destructive focus:ring-destructive",
            className,
          )}
        />
      </div>

      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}
