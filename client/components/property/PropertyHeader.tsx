"use client";

import { motion } from "framer-motion";
import {
  RiMapPinLine,
  RiShareLine,
  RiHeartLine,
  RiHeartFill,
  RiStarLine,
  RiFireLine,
} from "react-icons/ri";
import { useState } from "react";
import { Property, propertyTypeLabels } from "@/types/property";

const statusConfig = {
  available: {
    label: "Available",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
  sold: {
    label: "Sold",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  rented: {
    label: "Rented",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  pending: {
    label: "Pending",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
};

interface PropertyHeaderProps {
  property: Property;
}

export default function PropertyHeader({ property }: PropertyHeaderProps) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const status = property.status ? statusConfig[property.status] : null;
  const discountedPrice = property.discount?.amount
    ? property.price - property.discount.amount
    : property.discount?.percentage
      ? property.price * (1 - property.discount.percentage / 100)
      : null;

  const displayPrice = discountedPrice ?? property.price;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {property.isFeatured && (
          <span className="flex items-center gap-1 text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800 px-2.5 py-1 rounded-full">
            <RiStarLine size={12} />
            Featured
          </span>
        )}
        {property.sponsored && (
          <span className="flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-full">
            <RiFireLine size={12} />
            Sponsored
          </span>
        )}
        {status && (
          <span
            className={`text-xs font-semibold border px-2.5 py-1 rounded-full ${status.className}`}
          >
            {status.label}
          </span>
        )}
        <span className="text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700">
          For {property.listingType === "rent" ? "Rent" : "Sale"}
        </span>
        <span className="text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700">
          {propertyTypeLabels[property.type]}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-50 leading-tight mb-3">
        {property.title}
      </h1>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-5">
        <RiMapPinLine size={16} className="text-violet-500 shrink-0" />
        <span className="text-sm md:text-base">{property.location}</span>
      </div>

      {/* Price + actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl md:text-4xl font-bold text-violet-600 dark:text-violet-400">
              ₦{displayPrice.toLocaleString()}
            </span>
            {property.listingType === "rent" && (
              <span className="text-neutral-400 dark:text-neutral-500 text-sm font-medium">
                / year
              </span>
            )}
          </div>
          {discountedPrice && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-neutral-400 dark:text-neutral-500 text-sm line-through">
                ₦{property.price.toLocaleString()}
              </span>
              {property.discount?.percentage && (
                <span className="text-xs font-semibold bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full">
                  -{property.discount.percentage}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200"
          >
            <RiShareLine size={16} />
            {copied ? "Copied!" : "Share"}
          </button>
          <button
            onClick={() => setSaved((s) => !s)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border transition-all duration-200 ${
              saved
                ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950 dark:border-red-800 dark:text-red-400"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            {saved ? <RiHeartFill size={16} /> : <RiHeartLine size={16} />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
