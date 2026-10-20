import React from "react";

interface CompanyIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  strokeWidth?: number;
  title?: string;
}

export const CompanyIcon = ({
  className = "w-6 h-6",
  color = "currentColor",
  size = 24,
  strokeWidth = 1.75,
  title,
  ...props
}: CompanyIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title && <title>{title}</title>}
      <circle cx="6.25" cy="8" r="2.5" />
      <path d="M3.25 18.5v-2.25a2.75 2.75 0 0 1 2.75-2.75h0.5a2.75 2.75 0 0 1 2.75 2.75v2.25" />
      <path d="M5.6 16.4h1.3" /> 
      <path d="M13 18.5V6.25a1 1 0 0 1 1-1h6.5a1 1 0 0 1 1 1v12.25" />
      <path d="M15.25 8.25h2.25" />
      <path d="M15.25 11.25h2.25" />
      <path d="M15.25 14.25h2.25" />
      <path d="M2 21.5h20" />
    </svg>
  );
};

export default CompanyIcon;
