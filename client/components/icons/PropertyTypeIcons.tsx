import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function ParkingCircleIcon({
  size = 24,
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9 17V7h4.5a3 3 0 0 1 0 6H9" />
    </svg>
  );
}

export function ParkingSquareIcon({
  size = 24,
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 17V7h4.5a3 3 0 0 1 0 6H9" />
    </svg>
  );
}

export function ElevatorIcon({
  size = 24,
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 10V7l4-2 4 2v3" />
      <path d="M8 14v3l4 2 4-2v-3" />
    </svg>
  );
}

export function RoadIcon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M4 19L8 5h8l4 14" />
      <path d="M12 8v2" />
      <path d="M12 12v2" />
      <path d="M12 16v2" />
    </svg>
  );
}

export function DumpsterIcon({
  size = 24,
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M4 8h16l-1 12H5L4 8z" />
      <path d="M3 8h18" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function RestaurantIcon({
  size = 24,
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* Fork */}
      <path d="M7 3v6c0 1.5 1.5 2 1.5 2v10" />
      <path d="M5 3v5" />
      <path d="M9 3v5" />

      {/* Knife */}
      <path d="M17 3v18" />
      <path d="M17 3c2 2 2 6 0 8" />
    </svg>
  );
}
