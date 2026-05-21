"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";
import { LuTriangleAlert, LuInfo } from "react-icons/lu";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: React.ReactNode;

  rememberKey?: string;
  rememberLabel?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(
  undefined,
);

export function ConfirmationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
    options: ConfirmOptions;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPromise({ resolve, options });
    });
  }, []);

  const handleClose = useCallback(
    (confirmed: boolean) => {
      if (promise) {
        promise.resolve(confirmed);
        setPromise(null);
      }
    },
    [promise],
  );

  useEffect(() => {
    if (!promise) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [promise, handleClose]);

  useEffect(() => {
    if (promise) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [promise]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {promise &&
        createPortal(
          <ConfirmDialog
            options={promise.options}
            onConfirm={() => handleClose(true)}
            onCancel={() => handleClose(false)}
          />,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context)
    throw new Error("useConfirm must be used within ConfirmationProvider");
  return context;
}

const variantMap: Record<
  ConfirmVariant,
  { bg: string; icon: React.ReactNode }
> = {
  danger: {
    bg: "bg-rose-50 border-rose-200",
    icon: <LuTriangleAlert className="w-6 h-6 text-rose-500" />,
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    icon: <LuTriangleAlert className="w-6 h-6 text-amber-500" />,
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    icon: <LuInfo className="w-6 h-6 text-blue-500" />,
  },
};

function ConfirmDialog({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const {
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "info",
    icon,
    rememberKey,
    rememberLabel = "Don't ask again",
  } = options;

  const [dontAsk, setDontAsk] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Autofocus confirm button
  useEffect(() => {
    confirmBtnRef.current?.focus();
  }, []);

  // If rememberKey is set, check localStorage on mount
  useEffect(() => {
    if (rememberKey && localStorage.getItem(rememberKey) === "true") {
      // User previously chose "don't ask" → auto confirm
      onConfirm();
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = () => {
    if (rememberKey && dontAsk) {
      localStorage.setItem(rememberKey, "true");
    }
    onConfirm();
  };

  const variantStyle = variantMap[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={cn(
          "w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 animate-in zoom-in-95",
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "shrink-0 w-12 h-12 rounded-full flex items-center justify-center border",
              variantStyle.bg,
            )}
          >
            {icon || variantStyle.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-title"
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {rememberKey && (
          <div className="mt-4">
            <Checkbox
              id={rememberKey}
              checked={dontAsk}
              onChange={(e) => setDontAsk(e.target.checked)}
              label={rememberLabel}
            />
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel} className="text-sm">
            {cancelLabel}
          </Button>
          <Button
            ref={confirmBtnRef}
            variant={variant === "danger" ? "danger" : "secondary"}
            onClick={handleConfirm}
            className="text-sm"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
