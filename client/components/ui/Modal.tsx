"use client";

import { useEffect, useCallback } from "react";
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
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  const { bannerHeight } = useBannerHeightContext();

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={cn(
              "fixed inset-0 z-50  bg-black/50 backdrop-blur-sm",
              overlayClassName,
            )}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute right-4 top-4 w-12 h-12 hover:text-muted flex justify-center items-center bg-inverse border border-border rounded-full text-2xl z-1"
              onClick={onClose}
              style={{ top: `calc(${bannerHeight + 16}px)` }}
            >
              <span className="sr-only">Close modal</span>
              <LuX />
            </div>

            <div
              className={cn(
                "flex h-full w-full items-end justify-center md:items-center md:p-4 z-1",
                positionClassName,
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                className={cn(
                  "w-full max-w-xl bg-card rounded-t-2xl md:rounded-2xl overflow-y-auto max-h-[85vh] md:max-h-[80vh] shadow-2xl border-border border",
                  className,
                )}
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
