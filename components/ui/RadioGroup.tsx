"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

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
}

export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  required = false,
}: RadioGroupProps) {
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex flex-col p-4 border rounded-xl cursor-pointer transition-all hover:border-violet-600",
              value === option.value
                ? "border-violet-600 bg-violet-50 ring-1 ring-violet-600"
                : "border-gray-200"
            )}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="w-4 h-4 text-violet-600 focus:ring-violet-600 border-gray-300"
                required={required}
              />
              <span className="font-medium text-gray-900">{option.label}</span>
            </div>
            {option.description && (
              <p className="text-sm text-gray-500 mt-1 ml-7">
                {option.description}
              </p>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}