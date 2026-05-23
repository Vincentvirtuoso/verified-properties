import { cn } from "@/lib/utils";
import Image from "next/image";
import Link, { LinkProps } from "next/link";
import logo from "@/app/logo.png";
import { forwardRef } from "react";

interface BrandmarkProps {
  direction?: "row" | "col";
  logoOnly?: boolean;
  taglineOnly?: boolean;
  alignStart?: boolean;
  logoSize?: number;
  tagline?: React.ReactNode;
  className?: string;
  href?: string;
  linkProps?: Omit<LinkProps, "href">;
  description?: string;
  onClick?: () => void;
}

const DefaultTagline = () => (
  <span className="text-xl md:text-2xl font-extrabold tracking-tight">
    <span className="text-primary group-hover:text-primary/90 transition-colors">
      Verified
    </span>
    <span className="text-orange-500 group-hover:text-orange-600 transition-colors">
      Properties
    </span>
  </span>
);

export const Brandmark = forwardRef<
  HTMLAnchorElement | HTMLDivElement,
  BrandmarkProps
>(
  (
    {
      direction = "row",
      logoOnly = false,
      taglineOnly = false,
      logoSize = 40,
      tagline = <DefaultTagline />,
      className,
      href = "/",
      linkProps,
      description,
      alignStart,
      onClick,
    },
    ref,
  ) => {
    const isRow = direction === "row";
    const showLogo = !taglineOnly;
    const showTagline = !logoOnly;

    const content = (
      <div
        className={cn(
          "inline-flex gap-2 group",
          isRow ? "flex-row" : "flex-col",
          alignStart ? "items-start" : "items-center",
          className,
        )}
      >
        {showLogo && (
          <div
            className="relative shrink-0"
            style={{ width: logoSize, height: logoSize }}
          >
            <Image
              src={logo}
              alt="Brand logo"
              fill
              className="object-contain rounded-2xl transition-shadow duration-300 group-hover:shadow-lg"
              priority
            />
          </div>
        )}
        <div>
          {showTagline && (
            <p
              className={cn(
                "font-bold whitespace-nowrap transition-colors",
                isRow ? "text-md" : "text-base",
                !alignStart && "text-center",
                !showLogo && (isRow ? "ml-0" : "mt-0"),
              )}
            >
              {tagline}
            </p>
          )}
          {description && (
            <span className={cn("text-sm", !alignStart && "text-center")}>
              {description}
            </span>
          )}
        </div>
      </div>
    );

    const commonProps = {
      onClick,
      "aria-label": "VerifiedProperties Home",
    };

    if (href) {
      return (
        <Link
          href={href}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          {...linkProps}
          {...commonProps}
        >
          {content}
        </Link>
      );
    }

    return (
      <div
        ref={ref as React.ForwardedRef<HTMLDivElement>}
        role="button"
        tabIndex={onClick ? 0 : undefined}
        {...commonProps}
      >
        {content}
      </div>
    );
  },
);

Brandmark.displayName = "Brandmark";
