"use client";

import { useEffect, useRef, useState } from "react";
import { LuCheck, LuX } from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui/Button";
import { approveCompanyRegistration } from "../api/companyRequests";

interface ApproveActionProps {
  registrationId: string;
  companyName: string;
  onApproved: () => void;
}

export function ApproveAction({
  registrationId,
  companyName,
  onApproved,
}: ApproveActionProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirming) return;
    const target = panelRef.current?.querySelector<HTMLButtonElement>(
      "button:not([disabled])",
    );
    target?.focus();
  }, [confirming]);

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      await approveCompanyRegistration(registrationId);

      setConfirming(false);
      onApproved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Approval failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    if (busy) return;
    setConfirming(false);
    setError(null);
  };

  if (!confirming) {
    return (
      <Button size="sm" onClick={() => setConfirming(true)}>
        <LuCheck size={14} aria-hidden="true" />
        Approve
      </Button>
    );
  }

  return (
    <div
      ref={panelRef}
      role="group"
      aria-label={`Confirm approval for ${companyName}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          cancel();
        }
      }}
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3"
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">
          Approve <span className="font-semibold">{companyName}</span>?
        </p>
        <p className="text-xs text-muted">
          Their account becomes a company account immediately.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <p className="font-medium">Couldn&apos;t approve this application.</p>
          <p className="mt-0.5 wrap-break-word">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="xs" onClick={approve} disabled={busy} aria-busy={busy}>
          {busy ? (
            <>
              <span
                aria-hidden="true"
                className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              Approving…
            </>
          ) : error ? (
            "Try again"
          ) : (
            "Confirm approval"
          )}
        </Button>
        <Button size="xs" variant="ghost" onClick={cancel} disabled={busy}>
          <LuX size={12} aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
