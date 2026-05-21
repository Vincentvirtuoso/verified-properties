"use client";
import { motion } from "framer-motion";
import {
  LuHouse,
  LuTrendingUp,
  LuBriefcase,
  LuScale,
  LuFactory,
  LuBook,
} from "react-icons/lu";

const categories = [
  { label: "Real Estate", icon: <LuHouse className="h-5 w-5" />, href: "#" },
  {
    label: "Investment",
    icon: <LuTrendingUp className="h-5 w-5" />,
    href: "#",
  },
  {
    label: "Development",
    icon: <LuBriefcase className="h-5 w-5" />,
    href: "#",
  },
  { label: "JV Structures", icon: <LuScale className="h-5 w-5" />, href: "#" },
  {
    label: "Industrial Projects",
    icon: <LuFactory className="h-5 w-5" />,
    href: "#",
  },
  { label: "Property Law", icon: <LuBook className="h-5 w-5" />, href: "#" },
];

export default function CategoriesSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold mb-8">Learning Categories</h2>
      <div className="flex flex-wrap gap-4">
        {categories.map((cat, i) => (
          <motion.a
            key={cat.label}
            href={cat.href}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-colors"
          >
            {cat.icon}
            {cat.label}
          </motion.a>
        ))}
      </div>
    </section>
  );
}
