"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { LuX } from "react-icons/lu";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  positionClassName?: string;
}

export function Modal({
  open,
  onClose,
  children,
  className,
  overlayClassName,
  positionClassName,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  const { bannerHeight } = useBannerHeightContext();

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-overlay"
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            overlayClassName,
          )}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.15 } }}
        >
          <button
            type="button"
            aria-label="Close modal"
            className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-inverse text-2xl hover:text-muted z-10"
            onClick={onClose}
            style={{ top: `calc(${bannerHeight + 16}px)` }}
          >
            <LuX />
          </button>

          <div
            className={cn(
              "flex h-full w-full items-end justify-center md:items-center md:p-4",
              positionClassName,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              className={cn(
                "w-full max-w-xl overflow-y-auto rounded-t-2xl border border-border bg-card shadow-2xl max-h-[85vh] md:max-h-[80vh] md:rounded-2xl",
                className,
              )}
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
