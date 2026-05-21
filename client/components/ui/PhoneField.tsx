"use client";

import { FiChevronDown } from "react-icons/fi";
import { useState, useEffect } from "react";
import { FieldLabel } from "./FieldLabel";
import { countries, Country } from "@/utils/constants";

interface PhoneFieldProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  defaultCountry?: string;
  className?: string;
}

export function PhoneField({
  label = "Phone Number",
  name = "phone",
  value,
  onChange,
  error,
  required = true,
  defaultCountry = "ng",
  className,
}: PhoneFieldProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find((c) => c.iso === defaultCountry.toLowerCase()) ||
      countries[0],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [localNumber, setLocalNumber] = useState("");

  useEffect(() => {
    const country = countries.find((c) => value.startsWith(c.code));
    if (country) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCountry(country);
      const num = value.slice(country.code.length).trim();
      setLocalNumber(num);
    } else {
      setLocalNumber(value.replace(/\D/g, ""));
    }
  }, [value]);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    const newFullNumber = country.code + (localNumber ? " " + localNumber : "");
    onChange(newFullNumber);
  };

  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, "");
    if (input.length > selectedCountry.maxLength) {
      input = input.slice(0, selectedCountry.maxLength);
    }
    let formatted = input;
    if (input.length > 3) {
      formatted = input.replace(
        /(\d{3})(\d{0,3})(\d{0,4})/,
        (_, p1, p2, p3) => {
          let result = p1;
          if (p2) result += ` ${p2}`;
          if (p3) result += ` ${p3}`;
          return result;
        },
      );
    }
    setLocalNumber(formatted);
    const fullNumber =
      selectedCountry.code + (formatted ? " " + formatted : "");
    onChange(fullNumber);
  };

  return (
    <div className={className}>
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>

      <div className="relative">
        <div className="flex border border-border rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-ring transition-all">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-3.5 bg-secondary hover:bg-secondary/80 border-r border-border min-w-27.5 focus:outline-none"
          >
            <span>{selectedCountry.flag}</span>
            <span className="font-mono text-sm font-medium text-foreground">
              {selectedCountry.code}
            </span>
            <FiChevronDown
              className={`ml-auto text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
              size={14}
            />
          </button>

          <input
            type="tel"
            name={name}
            value={localNumber}
            onChange={handleLocalNumberChange}
            placeholder={selectedCountry.placeholder}
            required={required}
            className="flex-1 bg-background px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-popover border border-border rounded-2xl shadow-xl z-50 max-h-80 overflow-auto py-2">
            {countries.map((country) => (
              <button
                key={country.iso}
                type="button"
                onClick={() => handleCountryChange(country)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary text-left transition-colors"
              >
                <span className="text-2xl">{country.flag}</span>
                <div className="flex-1">
                  <div className="font-medium text-popover-foreground">
                    {country.name}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {country.code}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-destructive text-xs mt-1.5 pl-1">{error}</p>}
    </div>
  );
}
