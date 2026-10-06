import { cn } from "@/lib/utils";

interface LogomarkProps {
  size?: number;
  className?: string;
  variant?: "brand" | "mono";
  title?: string;
}

export function Logomark({
  size = 40,
  className,
  variant = "brand",
  title = "Company logo",
}: LogomarkProps) {
  const branded = variant === "brand";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      <title>{title}</title>

      <circle
        cx="24"
        cy="24"
        r="24"
        fill={branded ? "#111111" : "currentColor"}
        fillOpacity={branded ? 1 : 0.12}
      />

      <path
        d="M14.5 22.2 24 14.8l9.5 7.4"
        stroke={branded ? "#ffffff" : "currentColor"}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.2 21.4V31.2c0 .7.5 1.2 1.2 1.2h11.2c.7 0 1.2-.5 1.2-1.2V21.4"
        stroke={branded ? "#ffffff" : "currentColor"}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.2 32.4v-5.2c0-.5.4-.9.9-.9h1.8c.5 0 .9.4.9.9v5.2"
        stroke={branded ? "#ffffff" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M15.5 35.2c3.2-1.6 6.1-2.2 8.5-2.2 2.6 0 5.4.7 8.5 2.4"
        stroke={branded ? "#2F6BFF" : "currentColor"}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
