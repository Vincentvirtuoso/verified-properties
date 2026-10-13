"use client";

import { useState } from "react";
import { Button } from "@affilhomes/shared/ui/Button";
import { DECISION_LABEL, errorText, type Decision } from "@affilhomes/shared/supabase/admin";

/**
 * Reason box + Approve / Reject / Request more info.
 * A reason is required for every decision (the database enforces it too)
 * and is saved in the audit log.
 */
export function ReviewActions({
  onDecide,
  decisions = ["approve", "reject", "more_info"],
  labels,
  placeholder = "Reason (required, saved in the audit log)",
}: {
  onDecide: (decision: Decision, reason: string) => Promise<void>;
  decisions?: Decision[];
  labels?: Partial<Record<Decision, string>>;
  placeholder?: string;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (d: Decision) => {
    if (!reason.trim()) {
      setError("Write a reason first.");
      return;
    }
    setBusy(d);
    setError(null);
    try {
      await onDecide(d, reason);
      setReason("");
    } catch (err) {
      setError(errorText(err, "Couldn't save that decision."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={reason}
          maxLength={1000}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        {decisions.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={
              d === "approve"
                ? "primary"
                : d === "reject"
                  ? "danger"
                  : "outline"
            }
            isLoading={busy === d}
            disabled={!!busy && busy !== d}
            onClick={() => decide(d)}
          >
            {labels?.[d] ?? DECISION_LABEL[d]}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Asks for a reason in a browser prompt, for one-click actions like "Take down". */
export function askReason(question: string): string | null {
  const r = window.prompt(
    `${question}\n\nReason (required, saved in the audit log):`,
  );
  if (r === null) return null;
  if (!r.trim()) {
    window.alert("A reason is required.");
    return null;
  }
  return r.trim();
}

export function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary">
      {children}
    </span>
  );
}

export function FilterChips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 ${value === o.value ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({
  children = "Nothing here.",
}: {
  children?: React.ReactNode;
}) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
  );
}
