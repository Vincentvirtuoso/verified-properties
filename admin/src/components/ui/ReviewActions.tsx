"use client";

import { useState, type ReactNode } from "react";
import { Button, Textarea } from "@affilhomes/shared/ui";

export type ReviewDecision = "approve" | "reject" | "more_info";

export function Empty({
  title = "Nothing to review",
  message = "You’re all caught up.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  AskReason                                                                 */
/* -------------------------------------------------------------------------- */

export function AskReason({
  label = "Ask reason",
  prompt,
  placeholder = "Type your reason…",
  confirmLabel = "Submit",
  cancelLabel = "Cancel",
  destructive = false,
  size = "sm",
  disabled = false,
  minLength = 1,
  maxLength = 1000,
  onConfirm,
}: {
  label?: string;
  prompt?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  onConfirm: (reason: string) => Promise<void>;
  
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setOpen(false);
    setReason("");
    setError(null);
  };

  const submit = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < minLength) {
      setError("A reason is required.");
      return;
    }
    if (trimmed.length > maxLength) {
      setError(`Keep it under ${maxLength} characters.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn’t save the reason.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button
        type="button"
        size={size}
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={
          destructive
            ? "border-destructive/40 text-destructive hover:bg-destructive/10"
            : undefined
        }
      >
        {label}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {prompt && (
        <p className="text-xs font-medium text-muted-foreground">{prompt}</p>
      )}
      <Textarea
        name=""
        rows={3}
        autoFocus
        value={reason}
        onChange={(value) => {
          setReason(value);
          if (error) setError(null);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring aria-invalid:border-destructive"
        aria-invalid={!!error}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {reason.trim().length}/{maxLength}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size={size}
            variant="outline"
            onClick={reset}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size={size}
            onClick={submit}
            disabled={submitting}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:opacity-90"
                : undefined
            }
          >
            {submitting ? "Saving…" : confirmLabel}
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium capitalize text-secondary-foreground">
      {children}
    </span>
  );
}

export function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ReviewActions({
  onDecide,labels,
}: {
  onDecide: (decision: ReviewDecision, reason: string) => Promise<void>;
  labels?: Partial<Record<ReviewDecision, string>>;
}) {
  const [pending, setPending] = useState<ReviewDecision | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labelFor = (d: ReviewDecision, fallback: string) =>
    labels?.[d] ?? fallback;

  const reset = () => {
    setPending(null);
    setReason("");
    setError(null);
  };

  const submit = async () => {
    if (!pending) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("A reason is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onDecide(pending, trimmed);
      reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn’t save the decision.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (pending) {
    return (
      <div className="space-y-2">
        <Textarea
          name=""
          rows={3}
          autoFocus
          value={reason}
          onChange={(value) => {
            setReason(value);
            if (error) setError(null);
          }}
          placeholder={
            pending === "approve"
              ? "What did you check before approving?"
              : pending === "reject"
                ? "Why are you rejecting this?"
                : "What more do you need from the user?"
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring aria-invalid:border-destructive"
          aria-invalid={!!error}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={submitting}
            className={
              pending === "reject"
                ? "bg-destructive text-destructive-foreground hover:opacity-90"
                : undefined
            }
          >
            {submitting
              ? "Saving…"
              : pending === "approve"
                ? "Confirm approval"
                : pending === "reject"
                  ? "Confirm rejection"
                  : "Send request"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={reset}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={() => setPending("approve")}>
        {labelFor("approve", "Approve")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setPending("more_info")}
      >
        {labelFor("more_info", "Request more info")}{" "}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setPending("reject")}
        className="border-destructive/40 text-destructive hover:bg-destructive/10"
      >
        {labelFor("reject", "Reject")}{" "}
      </Button>
    </div>
  );
}
