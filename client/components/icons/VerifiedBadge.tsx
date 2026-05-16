"use client";

import React from "react";

export type VerifiedBadgeSize = "sm" | "md" | "lg";
export type VerifiedBadgeVariant = "violet" | "success" | "info" | "muted";

export interface VerifiedBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: VerifiedBadgeSize;
  variant?: VerifiedBadgeVariant;
  showText?: boolean;
}

const sizeClasses: Record<
  VerifiedBadgeSize,
  { container: string; svg: string }
> = {
  sm: { container: "text-[10px] gap-0.5", svg: "w-3 h-3" },
  md: { container: "text-xs gap-1", svg: "w-4 h-4" },
  lg: { container: "text-sm gap-1.5", svg: "w-5 h-5" },
};

const variantClasses: Record<VerifiedBadgeVariant, string> = {
  violet: "text-violet-600",
  success: "text-emerald-600",
  info: "text-blue-600",
  muted: "text-gray-400",
};

const VerifiedBadge = ({
  text = "Verified",
  size = "sm",
  variant = "violet",
  showText = true,
  className = "",
  ...props
}: VerifiedBadgeProps) => {
  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  return (
    <div
      className={`inline-flex items-center shrink-0 font-medium ${currentSize.container} ${currentVariant} ${className}`}
      {...props}
    >
      <svg
        className={`${currentSize.svg} shrink-0`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      {showText && <span>{text}</span>}
    </div>
  );
};

export default VerifiedBadge;
