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
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
            "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all",
            Icon && "pl-10",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
        />
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}