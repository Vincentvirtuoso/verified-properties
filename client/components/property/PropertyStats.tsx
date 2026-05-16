"use client";

import { motion } from "framer-motion";
import {
  RiLayoutLine,
  RiHome4Line,
  RiLeafLine,
  RiCpuLine,
  RiHotelBedLine,
  RiServiceLine,
} from "react-icons/ri";
import { PopulatedProperty, PropertyFeature } from "@/types/property";
import { LuBath, LuBed } from "react-icons/lu";
import { PROPERTY_FEATURE_LABELS } from "@/utils/constants";

const featureIcons: Record<PropertyFeature, React.ReactNode> = {
  boysQuarters: <RiHome4Line size={14} />,
  penthouse: <RiHotelBedLine size={14} />,
  garden: <RiLeafLine size={14} />,
  smartHome: <RiCpuLine size={14} />,
  furnished: <RiLayoutLine size={14} />,
  serviced: <RiServiceLine size={14} />,
};

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

  return (
    <div className="space-y-5">
      {stats.length > 0 && (
        <div
          className={`grid gap-3 ${stats.length === 2 ? "grid-cols-2" : stats.length === 1 ? "grid-cols-1" : "grid-cols-3"}`}
        >
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {property.features && property.features.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
            Features & Amenities
          </p>
          <div className="flex flex-wrap gap-2">
            {property.features.map((feature) => (
              <span
                key={feature}
                className="flex items-center gap-1.5 text-sm font-medium bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900 px-3 py-1.5 rounded-full"
              >
                {featureIcons[feature]}
                {PROPERTY_FEATURE_LABELS[feature]}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
