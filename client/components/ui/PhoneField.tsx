"use client";

import { FiChevronDown } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track alignment coordinates along with current placement state
  const [coords, setCoords] = useState<{
    top: number | "auto";
    bottom: number | "auto";
    left: number;
    width: number;
    placement: "top" | "bottom";
  }>({
    top: 0,
    bottom: "auto",
    left: 0,
    width: 0,
    placement: "bottom",
  });

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

  // Dynamic position updater with smart collision detection
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updateCoordinates = () => {
      const rect = containerRef.current!.getBoundingClientRect();

      // max-h-80 is 320px, plus we add a 20px buffer for padding and spacing
      const dropdownHeightBudget = 340;
      const spaceBelow = window.innerHeight - rect.bottom;

      // Flip up if there isn't enough space below AND there is more room above
      if (spaceBelow < dropdownHeightBudget && rect.top > spaceBelow) {
        setCoords({
          top: "auto",
          bottom: window.innerHeight - rect.top, // Anchors to the top edge of the input
          left: rect.left,
          width: rect.width,
          placement: "top",
        });
      } else {
        setCoords({
          top: rect.bottom, // Anchors directly beneath the input
          bottom: "auto",
          left: rect.left,
          width: rect.width,
          placement: "bottom",
        });
      }
    };

    updateCoordinates();

    window.addEventListener("resize", updateCoordinates);
    window.addEventListener("scroll", updateCoordinates, true);

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", updateCoordinates);
      window.removeEventListener("scroll", updateCoordinates, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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

      <div className="relative" ref={containerRef}>
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

        {isOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: coords.top !== "auto" ? `${coords.top}px` : "auto",
                bottom:
                  coords.bottom !== "auto" ? `${coords.bottom}px` : "auto",
                left: `${coords.left}px`,
                width: `${coords.width}px`,
              }}
              className={`bg-popover border border-border rounded-2xl shadow-xl z-9999 pr-1 py-2 transition-all max-w-90 ${
                coords.placement === "bottom" ? "mt-2" : "mb-2"
              }`}
            >
              <div className=" py-2 max-h-60 overflow-auto">
                {countries.map((country) => (
                  <button
                    key={country.iso}
                    type="button"
                    onClick={() => handleCountryChange(country)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/20 text-left transition-colors"
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1">
                      <div className="font-medium text-popover-foreground text-sm">
                        {country.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {country.code}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )}
      </div>

      {error && <p className="text-destructive text-xs mt-1.5 pl-1">{error}</p>}
    </div>
  );
}
