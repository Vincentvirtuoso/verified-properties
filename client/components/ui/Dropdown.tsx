"use client";

import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useLayoutEffect,
} from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  placement: DropdownProps["placement"];
  offset: number;
}

const DropdownContext = createContext<DropdownContextType | undefined>(
  undefined,
);

const useDropdownContext = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within a Dropdown");
  }
  return context;
};

interface DropdownProps {
  children: React.ReactNode;
  className?: string;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  offset?: number;
  onOpenChange?: (open: boolean) => void;
}

export function Dropdown({
  children,
  className,
  placement = "bottom-start",
  offset = 8,
  onOpenChange,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
      if (!open) {
        setActiveIndex(-1);
      }
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return;
      }
      handleOpenChange(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, handleOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleOpenChange(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleOpenChange]);

  return (
    <DropdownContext.Provider
      value={{
        isOpen,
        setIsOpen: handleOpenChange,
        activeIndex,
        setActiveIndex,
        triggerRef,
        contentRef,
        placement,
        offset,
      }}
    >
      <div className={cn("relative inline-block", className)}>{children}</div>
    </DropdownContext.Provider>
  );
}

interface DropdownTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export function DropdownTrigger({
  children,
  className,
  asChild = false,
}: DropdownTriggerProps) {
  const { isOpen, setIsOpen, triggerRef } = useDropdownContext();

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  };

  if (asChild && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childElement = children as React.ReactElement<any>;
    return React.cloneElement(childElement, {
      ref: triggerRef,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      "aria-haspopup": "menu",
      "aria-expanded": isOpen,
      className: cn(childElement.props.className, className),
    });
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      className={className}
    >
      {children}
    </button>
  );
}

interface DropdownContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownContent({ children, className }: DropdownContentProps) {
  const { isOpen, contentRef, triggerRef, placement, offset, setActiveIndex } =
    useDropdownContext();

  // Track dynamic adjustments if menu hits screen boundaries
  const [adjustedPlacement, setAdjustedPlacement] = useState(placement);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !contentRef.current) return;

    // Reset layout calculation alignment context
    setAdjustedPlacement(placement);

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let currentVertical = placement?.startsWith("top") ? "top" : "bottom";
    let currentHorizontal = placement?.endsWith("end") ? "end" : "start";

    // Bottom collision detection -> Flip up
    if (
      currentVertical === "bottom" &&
      triggerRect.bottom + contentRect.height > viewportHeight
    ) {
      if (triggerRect.top - contentRect.height > 0) {
        currentVertical = "top";
      }
    }
    // Top collision detection -> Flip down
    else if (
      currentVertical === "top" &&
      triggerRect.top - contentRect.height < 0
    ) {
      if (triggerRect.bottom + contentRect.height < viewportHeight) {
        currentVertical = "bottom";
      }
    }

    // Right side window boundary safety checks
    if (
      currentHorizontal === "start" &&
      triggerRect.left + contentRect.width > viewportWidth
    ) {
      currentHorizontal = "end";
    } else if (
      currentHorizontal === "end" &&
      triggerRect.right - contentRect.width < 0
    ) {
      currentHorizontal = "start";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAdjustedPlacement(`${currentVertical}-${currentHorizontal}` as any);
  }, [isOpen, placement, triggerRef, contentRef]);

  const handleMouseEnter = () => setActiveIndex(-1);

  const placementStyles = {
    "bottom-start": { top: `calc(100% + ${offset}px)`, left: 0 },
    "bottom-end": { top: `calc(100% + ${offset}px)`, right: 0 },
    "top-start": { bottom: `calc(100% + ${offset}px)`, left: 0 },
    "top-end": { bottom: `calc(100% + ${offset}px)`, right: 0 },
  }[adjustedPlacement || "bottom-start"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={contentRef}
          initial={{
            opacity: 0,
            scale: 0.95,
            y: placement?.startsWith("top") ? 10 : -10,
          }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: placement?.startsWith("top") ? 10 : -10,
          }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{
            position: "absolute",
            zIndex: 50,
            ...placementStyles,
          }}
          onMouseEnter={handleMouseEnter}
          className={cn(
            "min-w-50 bg-card rounded-lg shadow-lg border border-border py-1",
            "focus:outline-none",
            className,
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  shortcut?: string;
  destructive?: boolean;
}

export function DropdownItem({
  children,
  className,
  onClick,
  disabled = false,
  icon,
  shortcut,
  destructive = false,
}: DropdownItemProps) {
  const { setIsOpen } = useDropdownContext();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center justify-between px-3 py-2 mx-1 rounded-md",
        "cursor-pointer select-none outline-none",
        "transition-colors duration-150",
        disabled && "opacity-50 cursor-not-allowed",
        destructive
          ? "text-red-600 hover:bg-red-50 focus:bg-red-50"
          : "text-foreground hover:text-primary hover:bg-card-foreground/10 focus:bg-card-foreground/20",
        className,
      )}
      aria-disabled={disabled}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
        <span className="text-sm">{children}</span>
      </div>
      {shortcut && (
        <span className="text-xs text-gray-400 ml-4">{shortcut}</span>
      )}
    </div>
  );
}

interface DropdownSeparatorProps {
  className?: string;
}

export function DropdownSeparator({ className }: DropdownSeparatorProps) {
  return (
    <div role="separator" className={cn("h-px bg-border my-1", className)} />
  );
}

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownSubmenuProps {
  children: React.ReactNode;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export function DropdownSubmenu({
  children,
  label,
  icon,
}: DropdownSubmenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between px-3 py-2 mx-1 rounded-md hover:bg-gray-100 cursor-pointer">
        <div className="flex items-center gap-2">
          {icon && <span className="w-4 h-4">{icon}</span>}
          <span className="text-sm text-gray-700">{label}</span>
        </div>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute left-full top-0 ml-1 min-w-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
