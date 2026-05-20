"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import { LuChevronRight, LuHouse } from "react-icons/lu";
import { FiMoreHorizontal } from "react-icons/fi";
import { cn } from "@/lib/utils";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/Dropdown";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  description?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHomeIcon?: boolean;
  homeHref?: string;
  className?: string;
  itemClassName?: string;
  activeClassName?: string;
  maxItems?: number;
  truncate?: boolean;
  variant?: "default" | "minimal" | "bordered";
  size?: "sm" | "md" | "lg";
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: "text-xs py-2",
  md: "text-sm py-3",
  lg: "text-base py-4",
};

const variantClasses = {
  default: "",
  minimal: "text-gray-500",
  bordered: "border-b border-gray-200 bg-white px-4 rounded-t-lg",
};

export function Breadcrumbs({
  items,
  separator = <LuChevronRight className="w-4 h-4" />,
  showHomeIcon = true,
  homeHref = "/",
  className,
  itemClassName,
  activeClassName = "text-foreground font-medium",
  maxItems = 5,
  truncate = true,
  variant = "default",
  size = "md",
  onItemClick,
  showTooltip = false,
}: BreadcrumbsProps) {
  const processedItems = useMemo(() => {
    if (items.length <= maxItems) return items;

    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 2));

    return [
      firstItem,
      { label: "More", href: undefined, description: "Show more items" },
      ...lastItems,
    ];
  }, [items, maxItems]);

  const truncateLabel = (label: string, maxLength: number = 35) => {
    if (!truncate || label.length <= maxLength) return label;
    return `${label.substring(0, maxLength)}...`;
  };

  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  };

  const renderBreadcrumbItem = (
    item: BreadcrumbItem,
    index: number,
    isLast: boolean,
  ) => {
    const isEllipsis = item.label === "More";
    const content = (
      <span
        className={cn("flex items-center gap-1.5", isLast && activeClassName)}
      >
        {item.icon && <span className="shrink-0">{item.icon}</span>}
        <span className="line-clamp-1">{truncateLabel(item.label)}</span>
      </span>
    );

    if (isEllipsis) {
      const hiddenItems = items.slice(1, -(maxItems - 2));

      return (
        <Dropdown>
          <DropdownTrigger asChild>
            <button
              className="p-1 hover:bg-background rounded-md transition-colors"
              title="Show more"
            >
              <FiMoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </DropdownTrigger>
          <DropdownContent className="w-64">
            {hiddenItems.map((hiddenItem, idx) => (
              <DropdownItem
                key={idx}
                icon={hiddenItem.icon}
                onClick={() => {
                  if (hiddenItem.href) {
                    window.location.href = hiddenItem.href;
                  }
                  handleItemClick(hiddenItem, idx + 1);
                }}
              >
                <Link
                  href={hiddenItem.href || "#"}
                  className="w-full cursor-pointer"
                  onClick={() => handleItemClick(hiddenItem, idx + 1)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{hiddenItem.label}</span>
                    {hiddenItem.description && (
                      <span className="text-xs text-gray-500">
                        {hiddenItem.description}
                      </span>
                    )}
                  </div>
                </Link>
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>
      );
    }

    if (item.href && !isLast) {
      return (
        <Link
          href={item.href}
          className={cn(
            "text-gray-500 hover:text-primary transition-colors",
            itemClassName,
          )}
          onClick={() => handleItemClick(item, index)}
          title={showTooltip ? item.description || item.label : undefined}
        >
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(sizeClasses[size], variantClasses[variant], className)}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {/* Home Link */}
        {showHomeIcon && (
          <li className="flex items-center">
            <Link
              href={homeHref}
              className="text-gray-500 hover:text-primary transition-colors"
              aria-label="Home"
              title="Go to homepage"
            >
              <LuHouse className="w-4 h-4" />
            </Link>
            {items.length > 0 && (
              <span className="ml-1.5 text-gray-400">{separator}</span>
            )}
          </li>
        )}

        {/* Breadcrumb Items */}
        {processedItems.map((item, index) => {
          const isLast = index === processedItems.length - 1;
          const originalIndex =
            item.label === "More"
              ? -1
              : items.findIndex((i) => i.label === item.label);

          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className="flex items-center">
                {renderBreadcrumbItem(item, originalIndex, isLast)}
              </li>
              {!isLast && (
                <li
                  className="flex items-center text-gray-400"
                  aria-hidden="true"
                >
                  {separator}
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export function BreadcrumbSchema({
  items,
  homeHref = "/",
}: {
  items: BreadcrumbItem[];
  homeHref?: string;
}) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${process.env.NEXT_PUBLIC_SITE_URL}${homeHref}`,
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        item: item.href
          ? `${process.env.NEXT_PUBLIC_SITE_URL}${item.href}`
          : undefined,
      })),
    ].filter((item) => item.item),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
