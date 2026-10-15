import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

export function ListNewPropertyIcon({
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
      {/* House */}
      <path d="M4 11L12 4L20 11" />
      <path d="M6 10.5V20H18V10.5" />
      <path d="M10 20V15H14V20" />

      {/* Plus */}
      <path d="M19 5V9" />
      <path d="M17 7H21" />
    </svg>
  );
}
