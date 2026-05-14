import { motion } from "framer-motion";
import React from "react";

export interface StatItem {
  id: string;
  label: string;
  value: number | string;
  icon: React.ElementType;
  colorClass: string;
}

export const StatCard = ({
  stat,
  index,
}: {
  stat: StatItem;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -5 }}
    className={`flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300`}
  >
    <div className={`p-3 rounded-xl ${stat.colorClass}`}>
      <stat.icon className="text-2xl" />
    </div>
    <div>
      <h4 className="text-3xl font-bold tracking-tight text-foreground">
        {typeof stat.value === "number"
          ? stat.value.toLocaleString()
          : stat.value}
      </h4>
      <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        {stat.label}
      </p>
    </div>
  </motion.div>
);
