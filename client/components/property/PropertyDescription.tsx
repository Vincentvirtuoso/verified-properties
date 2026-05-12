"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiArrowDownSLine } from "react-icons/ri";

interface PropertyDescriptionProps {
  description: string;
  title: string;
}

export default function PropertyDescription({
  description,
  title,
}: PropertyDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 300;
  const preview = isLong ? description.slice(0, 300) + "…" : description;

  return (
    <div>
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-3">
        About this property
      </h2>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.p
            key={expanded ? "full" : "preview"}
            className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[15px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {expanded ? description : preview}
          </motion.p>
        </AnimatePresence>

        {isLong && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white dark:from-neutral-950 to-transparent pointer-events-none" />
        )}
      </div>

      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <RiArrowDownSLine size={16} />
          </motion.span>
        </button>
      )}
    </div>
  );
}
