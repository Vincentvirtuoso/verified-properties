"use client";

import { FiChevronDown } from "react-icons/fi";
import { Field } from "./Field";
import { useState, useEffect } from "react";
import { FieldLabel } from "./FieldLabel";

interface Country {
  code: string;
  name: string;
  flag: string;
  placeholder: string;
  maxLength: number;
  iso: string;
}

const countries: Country[] = [
  {
    iso: "ng",
    code: "+234",
    name: "Nigeria",
    flag: "🇳🇬",
    placeholder: "801 234 5678",
    maxLength: 10,
  },
  {
    iso: "gh",
    code: "+233",
    name: "Ghana",
    flag: "🇬🇭",
    placeholder: "501 234 567",
    maxLength: 9,
  },
  {
    iso: "ke",
    code: "+254",
    name: "Kenya",
    flag: "🇰🇪",
    placeholder: "712 345 678",
    maxLength: 9,
  },
  {
    iso: "za",
    code: "+27",
    name: "South Africa",
    flag: "🇿🇦",
    placeholder: "71 234 5678",
    maxLength: 9,
  },
  {
    iso: "eg",
    code: "+20",
    name: "Egypt",
    flag: "🇪🇬",
    placeholder: "10 123 4567",
    maxLength: 10,
  },
  {
    iso: "et",
    code: "+251",
    name: "Ethiopia",
    flag: "🇪🇹",
    placeholder: "91 234 5678",
    maxLength: 9,
  },
  {
    iso: "ug",
    code: "+256",
    name: "Uganda",
    flag: "🇺🇬",
    placeholder: "71 234 5678",
    maxLength: 9,
  },
  {
    iso: "tz",
    code: "+255",
    name: "Tanzania",
    flag: "🇹🇿",
    placeholder: "71 234 5678",
    maxLength: 9,
  },
];

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
      <FieldLabel htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </FieldLabel>

      <div className="relative">
        <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:border-violet-600 focus-within:ring-1 focus-within:ring-violet-600 transition-all">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 border-r border-gray-200 min-w-[110px] focus:outline-none"
          >
            <span className="">{selectedCountry.flag}</span>
            <span className="font-mono text-sm font-medium">
              {selectedCountry.code}
            </span>
            <FiChevronDown
              className={`ml-auto text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
            className="flex-1 bg-white px-4 py-3.5 text-sm focus:outline-none placeholder:text-gray-400"
          />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-80 overflow-auto py-2">
            {countries.map((country) => (
              <button
                key={country.iso}
                type="button"
                onClick={() => handleCountryChange(country)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left transition-colors"
              >
                <span className="text-2xl">{country.flag}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {country.name}
                  </div>
                  <div className="text-sm text-gray-500 font-mono">
                    {country.code}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1.5 pl-1">{error}</p>}
    </div>
  );
}
