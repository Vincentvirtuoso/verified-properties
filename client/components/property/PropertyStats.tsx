"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  RiLayoutLine,
} from "react-icons/ri";
import type { PopulatedProperty } from "@affilhomes/shared/types/property";
import { LuBath, LuBed, LuChevronDown, LuChevronUp } from "react-icons/lu";
import { PROPERTY_FEATURE_LABELS } from "@/utils";
import type { PropertyFeature } from "@/types";
import { FEATURES } from "@/app/(authenticated)/list-property/components/constants";

const MAX_VISIBLE_FEATURES = 12;

const FEATURE_ICON_BY_VALUE: Partial<Record<PropertyFeature, React.ReactNode>> =
  Object.fromEntries(
    FEATURES.map((f) => [f.value, <f.icon key={f.value} size={14} />]),
  );

const FALLBACK_ICON = <RiLayoutLine size={14} />;

interface PropertyStatsProps {
  property: PopulatedProperty;
}

const StatCard = ({
  icon,
  value,
  label,
  delay,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  delay: number;
}) => (
  <motion.div
    className="flex flex-col items-center justify-center gap-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 text-center"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <span className="text-violet-500 dark:text-violet-400">{icon}</span>
    <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
      {value}
    </span>
    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">
      {label}
    </span>
  </motion.div>
);

export default function PropertyStats({ property }: PropertyStatsProps) {
  const [showAll, setShowAll] = useState(false);

  const stats = [
    ...(property.bedrooms > 0
      ? [
          {
            icon: <LuBed size={20} />,
            value: property.bedrooms,
            label: "Bedrooms",
            delay: 0.1,
          },
        ]
      : []),
    ...(property.bathrooms > 0
      ? [
          {
            icon: <LuBath size={20} />,
            value: property.bathrooms,
            label: "Bathrooms",
            delay: 0.15,
          },
        ]
      : []),
    ...(property.area
      ? [
          {
            icon: <RiLayoutLine size={20} />,
            value: `${property.area.toLocaleString()} m²`,
            label: "Total Area",
            delay: 0.2,
          },
        ]
      : []),
  ];

  const features = useMemo(() => {
    if (!property.features?.length) return [];
    return Array.from(new Set(property.features));
  }, [property.features]);

  const visibleFeatures = showAll
    ? features
    : features.slice(0, MAX_VISIBLE_FEATURES);
  const hiddenCount = features.length - visibleFeatures.length;

  return (
    <div className="space-y-5">
      {stats.length > 0 && (
        <div
          className={`grid gap-3 ${
            stats.length === 2
              ? "grid-cols-2"
              : stats.length === 1
                ? "grid-cols-1"
                : "grid-cols-3"
          }`}
        >
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {features.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Features &amp; Amenities
          </p>

          <div className="flex flex-wrap gap-2">
            {visibleFeatures.map((feature) => (
              <span
                key={feature}
                className="flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300"
              >
                {FEATURE_ICON_BY_VALUE[feature] ?? FALLBACK_ICON}
                {PROPERTY_FEATURE_LABELS[feature] ?? feature}
              </span>
            ))}

            {hiddenCount > 0 && !showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="flex items-center gap-1 rounded-full border border-dashed border-violet-300 bg-transparent px-3 py-1.5 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40"
              >
                +{hiddenCount} more
                <LuChevronDown size={14} />
              </button>
            )}

            {showAll && features.length > MAX_VISIBLE_FEATURES && (
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="flex items-center gap-1 rounded-full border border-dashed border-violet-300 bg-transparent px-3 py-1.5 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40"
              >
                Show less
                <LuChevronUp size={14} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
