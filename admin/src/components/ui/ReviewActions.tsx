"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  LuCheck,
  LuCircleHelp,
  LuInbox,
  LuPlus,
  LuX,
} from "react-icons/lu";
import { Button, Textarea } from "@affilhomes/shared/ui";
import { getErrorMessage } from "@affilhomes/shared/utils";

export type ReviewDecision = "approve" | "reject" | "more_info";
type Size = "sm" | "md" | "lg";
type Tone = "success" | "warning" | "danger" | "info";

const TONE: Record<
  Tone,
  { accent: string; panel: string; solid: string; outline: string }
> = {
  success: {
    accent: "text-success",
    panel: "border-success/30 bg-success/5",
    solid: "bg-success text-success-foreground hover:bg-success/90",
    outline: "border-success/40 text-success hover:bg-success/10",
  },
  warning: {
    accent: "text-warning",
    panel: "border-warning/30 bg-warning/5",
    solid: "bg-warning text-warning-foreground hover:bg-warning/90",
    outline: "border-warning/40 text-warning hover:bg-warning/10",
  },
  danger: {
    accent: "text-destructive",
    panel: "border-destructive/30 bg-destructive/5",
    solid: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border-destructive/40 text-destructive hover:bg-destructive/10",
  },
  info: {
    accent: "text-primary",
    panel: "border-primary/30 bg-primary/5",
    solid: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border-primary/40 text-primary hover:bg-primary/10",
  },
};

const DECISION_COPY: Record<
  ReviewDecision,
  {
    button: string;
    confirm: string;
    prompt: string;
    placeholder: string;
    icon: IconType;
    tone: Tone;
  }
> = {
  approve: {
    button: "Approve",
    confirm: "Approve",
    prompt: "What did you check before approving?",
    placeholder: "e.g. CAC number matches the registry, logo is legible…",
    icon: LuCheck,
    tone: "success",
  },
  reject: {
    button: "Reject",
    confirm: "Reject",
    prompt: "Why is this being rejected?",
    placeholder: "Explain the reason. The user will see this.",
    icon: LuX,
    tone: "danger",
  },
  more_info: {
    button: "Request more info",
    confirm: "Send request",
    prompt: "What do you need from the user?",
    placeholder: "Be specific so they know what to upload or correct.",
    icon: LuCircleHelp,
    tone: "warning",
  },
};

const QUICK_REASONS: Record<ReviewDecision, string[]> = {
  approve: [
    "CAC number matches the public registry.",
    "ID name matches the account holder.",
    "Logo and company details are consistent.",
  ],
  reject: [
    "CAC document is unreadable or expired.",
    "ID name doesn't match the account holder.",
    "Documents appear altered or inconsistent.",
  ],
  more_info: [
    "Upload a clearer copy of the CAC certificate.",
    "Provide a valid, unexpired government ID.",
    "Confirm the registered business address.",
  ],
};

const TONE_BY_STATUS = {
  neutral: "bg-secondary text-secondary-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/15 text-destructive",
} as const;

export function Empty({
  title = "Nothing to review",
  message = "You’re all caught up.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <LuInbox size={18} aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof TONE_BY_STATUS;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${TONE_BY_STATUS[tone]}`}
    >
      {children}
    </span>
  );
}

export function FilterChips<T extends string>({
  value,
  onChange,
  options,
  label = "Filter",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={[
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
            ].join(" ")}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                  active
                    ? "bg-primary-foreground/20"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ReasonForm({
  tone = "info",
  icon: Icon,
  prompt,
  placeholder,
  confirmLabel,
  cancelLabel = "Cancel",
  size = "sm",
  minLength = 1,
  maxLength = 1000,
  suggestions = [],
  onSubmit,
  onCancel,
}: {
  tone?: Tone;
  icon?: IconType;
  prompt?: string;
  placeholder: string;
  confirmLabel: string;
  cancelLabel?: string;
  size?: Size;
  minLength?: number;
  maxLength?: number;
  suggestions?: string[];
  onSubmit: (reason: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uid = useId();
  const textareaId = `${uid}-reason`;
  const t = TONE[tone];

  const trimmed = reason.trim();
  const tooShort = trimmed.length < minLength;
  const overLimit = trimmed.length > maxLength;
  const canSubmit = !submitting && !tooShort && !overLimit;

  const toggleSuggestion = (text: string) => {
    const isUsed = trimmed.includes(text);
    const next = isUsed
      ? trimmed
          .replace(text, "")
          .replace(/\s{2,}/g, " ")
          .trim()
      : trimmed
        ? `${trimmed} ${text}`
        : text;

    if (next.length > maxLength) {
      setError("That won't fit. Shorten your note first.");
      return;
    }
    setReason(next);
    setError(null);
    document.getElementById(textareaId)?.focus();
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Couldn't save. Your text is still here, so try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && !submitting) {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div
      onKeyDown={onKeyDown}
      className={`space-y-3 rounded-xl border p-3 ${t.panel}`}
    >
      {prompt && (
        <div className="flex items-start gap-2">
          {Icon && (
            <Icon
              size={16}
              aria-hidden="true"
              className={`mt-0.5 shrink-0 ${t.accent}`}
            />
          )}
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-foreground"
          >
            {prompt}
          </label>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Quick reasons
          </p>
          <div
            role="group"
            aria-label="Quick reasons"
            className="flex flex-wrap gap-1.5"
          >
            {suggestions.map((s) => {
              const used = trimmed.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={used}
                  disabled={submitting}
                  onClick={() => toggleSuggestion(s)}
                  className={`inline-flex max-w-full items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                    used
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  {used ? (
                    <LuCheck
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-primary"
                    />
                  ) : (
                    <LuPlus
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                    />
                  )}
                  <span>{s}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Textarea
        id={textareaId}
        rows={3}
        autoFocus
        value={reason}
        onChange={(value: string) => {
          setReason(value);
          if (error) setError(null);
        }}
        placeholder={placeholder}
        aria-invalid={!!error || overLimit}
        disabled={submitting}
        showCount
        maxLength={maxLength}
        error={error ?? undefined}
        description="Ctrl/⌘ + Enter to save · Esc to cancel"
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          size={size}
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="justify-center"
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          size={size}
          onClick={submit}
          disabled={!canSubmit}
          aria-busy={submitting}
          className={`justify-center gap-2 disabled:opacity-50 ${t.solid}`}
        >
          {submitting && (
            <span
              aria-hidden="true"
              className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          )}
          {submitting ? "Saving…" : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

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
  suggestions,
}: {
  label?: string;
  prompt?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  size?: Size;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  onConfirm: (reason: string) => Promise<void>;
  suggestions?: string[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        size={size}
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={destructive ? TONE.danger.outline : undefined}
      >
        {label}
      </Button>
    );
  }

  return (
    <ReasonForm
      tone={destructive ? "danger" : "info"}
      prompt={prompt}
      placeholder={placeholder}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      size={size}
      minLength={minLength}
      maxLength={maxLength}
      onSubmit={async (reason) => {
        await onConfirm(reason);
        setOpen(false);
      }}
      suggestions={suggestions}
      onCancel={() => setOpen(false)}
    />
  );
}

export function ReviewActions({
  onDecide,
  labels,
  disabled = false,
}: {
  onDecide: (decision: ReviewDecision, reason: string) => Promise<void>;
  labels?: Partial<Record<ReviewDecision, string>>;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState<ReviewDecision | null>(null);

  if (pending) {
    const copy = DECISION_COPY[pending];
    return (
      <ReasonForm
        tone={copy.tone}
        icon={copy.icon}
        prompt={copy.prompt}
        placeholder={copy.placeholder}
        confirmLabel={copy.confirm}
        onSubmit={async (reason) => {
          await onDecide(pending, reason);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
        suggestions={QUICK_REASONS[pending]}
      />
    );
  }

  const labelFor = (d: ReviewDecision) =>
    labels?.[d] ?? DECISION_COPY[d].button;

  return (
    <div
      role="group"
      aria-label="Review decision"
      className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap"
    >
      <Button
        type="button"
        size="xs"
        disabled={disabled}
        onClick={() => setPending("approve")}
        className={`justify-center gap-1.5 ${TONE.success.solid}`}
      >
        <LuCheck size={14} aria-hidden="true" />
        {labelFor("approve")}
      </Button>
      <Button
        type="button"
        size="xs"
        variant="outline"
        disabled={disabled}
        onClick={() => setPending("more_info")}
        className={`justify-center gap-1.5 ${TONE.warning.outline}`}
      >
        <LuCircleHelp size={14} aria-hidden="true" />
        {labelFor("more_info")}
      </Button>
      <Button
        type="button"
        size="xs"
        variant="outline"
        disabled={disabled}
        onClick={() => setPending("reject")}
        className={`justify-center gap-1.5 ${TONE.danger.outline}`}
      >
        <LuX size={14} aria-hidden="true" />
        {labelFor("reject")}
      </Button>
    </div>
  );
}
