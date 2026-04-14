"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
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
}: RadioGroupProps) {
  const groupId = useId();

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const radioId = `${groupId}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={radioId}
              className={cn(
                "group flex flex-col p-5 border rounded-2xl cursor-pointer transition-all duration-200",
                "hover:border-violet-500 hover:shadow-sm",
                isSelected
                  ? "border-violet-600 bg-violet-50 shadow-sm ring-1 ring-violet-200"
                  : "border-gray-200 hover:border-gray-300 bg-white",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative mt-0.5 flex-shrink-0">
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
                      "w-5 h-5 rounded-full border-2 transition-all",
                      isSelected
                        ? "border-violet-600 bg-white"
                        : "border-gray-300 group-hover:border-gray-400",
                    )}
                  >
                    {isSelected && (
                      <div className="w-full h-full bg-violet-600 rounded-full scale-75 transition-transform" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-900 text-[15px] block">
                    {option.label}
                  </span>
                  {option.description && (
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
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
        <p className="text-red-500 text-xs mt-1 pl-1 font-medium">{error}</p>
      )}
    </div>
  );
}
