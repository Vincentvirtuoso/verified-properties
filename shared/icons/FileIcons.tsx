import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function PdfIcon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      {...iconProps}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h2" />
      <path d="M8 17h8" />
      <path d="M8 9h1" />
    </svg>
  );
}

export function DocumentIcon({
  size = 24,
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      {...iconProps}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
      <path d="M8 9h2" />
    </svg>
  );
}

export function SheetIcon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      {...iconProps}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

export function ImageIcon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      {...iconProps}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

export function FolderIcon({
  size = 24,
  strokeWidth = 2,
  ...props
}: IconProps) {
  return (
    <svg
      {...iconProps}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.5l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
    </svg>
  );
}
