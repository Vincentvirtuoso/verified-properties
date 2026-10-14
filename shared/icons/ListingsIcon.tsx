import type { SVGProps } from "react";

interface ListingsIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

export function ListingsIcon({
  size = 24,
  strokeWidth = 2,
  ...props
}: ListingsIconProps) {
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
      <path d="M2 18V12.5L4.5 10L7 12.5V18" />

      <path d="M8 19V10L12 6L16 10V19" />
      <path d="M11 19V15.5H13V19" />

      <path d="M17 18V12.5L19.5 10L22 12.5V18" />
    </svg>
  );
}
