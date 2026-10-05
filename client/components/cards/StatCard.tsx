import { motion } from "framer-motion";
import React from "react";

export interface StatItem {
  id: string;
  label: string;
  value: number | string;
  icon: React.ElementType;
  colorClass: string;
}

interface StatCardProps {
  stat: StatItem;
  index: number;
}

export const StatCard = ({ stat, index }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -5 }}
    className="flex items-center gap-3 sm:gap-4 p-4 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
  >
    <div className={`shrink-0 p-2 rounded-xl ${stat.colorClass}`}>
      <stat.icon className="sm:text-2xl text-xl" />
    </div>
    <div className="min-w-0">
      <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        {typeof stat.value === "number"
          ? stat.value.toLocaleString()
          : stat.value}
      </h4>
      <p className="text-sm font-medium text-muted-foreground truncate">
        {stat.label}
      </p>
    </div>
  </motion.div>
);
