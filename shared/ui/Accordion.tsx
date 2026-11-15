"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LuChevronDown } from "react-icons/lu";
import { cn } from "../utils";

type AccordionContextType = {
  expandedValue: string | null;
  onToggle: (value: string) => void;
  baseId: string;
};

const AccordionContext = createContext<AccordionContextType>({
  expandedValue: null,
  onToggle: () => {},
  baseId: "",
});

const ItemContext = createContext<string>("");

/** Builds valid, unique DOM ids for one item from the accordion's id and the item's value. */
function itemIds(baseId: string, value: string) {
  const safe = value.replace(/[^a-zA-Z0-9_-]/g, "");
  return {
    trigger: `${baseId}-${safe}-trigger`,
    panel: `${baseId}-${safe}-panel`,
  };
}

export function Accordion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [expandedValue, setExpandedValue] = useState<string | null>(null);
  const baseId = useId();

  const handleToggle = useCallback((value: string) => {
    setExpandedValue((prev) => (prev === value ? null : value));
  }, []);

  return (
    <AccordionContext.Provider
      value={{ expandedValue, onToggle: handleToggle, baseId }}
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
          "overflow-hidden rounded-xl border border-border",
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
  icon?: ReactNode;
}) {
  const value = useContext(ItemContext);
  const { expandedValue, onToggle, baseId } = useContext(AccordionContext);
  const isExpanded = expandedValue === value;
  const ids = itemIds(baseId, value);

  return (
    <h3 className="m-0">
      <button
        type="button"
        id={ids.trigger}
        aria-expanded={isExpanded}
        aria-controls={ids.panel}
        onClick={() => onToggle(value)}
        className={cn(
          "flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          className,
        )}
      >
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground sm:text-base">
            {children}
          </span>
          <LuChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </span>
      </button>
    </h3>
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
  const { expandedValue, baseId } = useContext(AccordionContext);
  const isExpanded = expandedValue === value;
  const ids = itemIds(baseId, value);

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          key="content"
          id={ids.panel}
          role="region"
          aria-labelledby={ids.trigger}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className={cn("px-4 pb-4 pt-2", className)}>
            <div className="border-t border-border pt-2">{children}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
