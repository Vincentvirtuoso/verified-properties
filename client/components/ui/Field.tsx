"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { FieldLabel } from "./FieldLabel";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Button } from "./Button";

interface FieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "tel" | "number";
  placeholder?: string;
  value?: string | number;
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
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === "password";

  const inputType = isPasswordType && showPassword ? "text" : type;

  const togglePasswordVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={cn("space-y-1", className)}>
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon size={18} />
          </div>
        )}

        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={cn(
            "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all",
            Icon && "pl-10",
            isPasswordType && "pr-10",
            error &&
              "border-destructive focus:border-destructive focus:ring-destructive",
          )}
        />

        {isPasswordType && (
          <Button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 h-auto min-w-0 focus:ring-0 focus:ring-offset-0"
            size="sm"
            variant="ghost"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </Button>
        )}
      </div>

      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}
