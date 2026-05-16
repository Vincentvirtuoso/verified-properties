"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface AccordionContextType {
  expandedValue: string | null;
  onToggle: (value: string) => void;
}
const AccordionContext = createContext<AccordionContextType>({
  expandedValue: null,
  onToggle: () => {},
});

const ItemContext = createContext<string>("");

export function Accordion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [expandedValue, setExpandedValue] = useState<string | null>(null);

  const handleToggle = useCallback((value: string) => {
    setExpandedValue((prev) => (prev === value ? null : value));
  }, []);

  return (
    <AccordionContext.Provider
      value={{ expandedValue, onToggle: handleToggle }}
    >
      <div className={cn("space-y-4", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ItemContext.Provider value={value}>
      <div
        className={cn(
          "border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden",
          className,
        )}
      >
        {children}
      </div>
    </ItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className,
  icon,
}: {
  children: ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  const value = useContext(ItemContext);
  const { expandedValue, onToggle } = useContext(AccordionContext);
  const isExpanded = expandedValue === value;

  return (
    <button
      onClick={() => onToggle(value)}
      className={cn(
        "w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors",
        className,
      )}
    >
      {icon && (
        <div className="shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
            {children}
          </h3>
          <LuChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </div>
      </div>
    </button>
  );
}

export function AccordionContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const value = useContext(ItemContext);
  const { expandedValue } = useContext(AccordionContext);
  const isExpanded = expandedValue === value;

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className={cn("px-4 pb-4 pt-2", className)}>
            <div className="pt-2 border-t border-gray-100 dark:border-neutral-800">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
