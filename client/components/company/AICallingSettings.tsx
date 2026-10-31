"use client";

import { useEffect, useState } from "react";
import { LuBot } from "react-icons/lu";

import { createClient } from "@affilhomes/shared/supabase/client";
import { Badge, Button, Spinner } from "@affilhomes/shared/ui";
import { cn } from "@/lib/utils";

type AssistantConfig = {
  assistant_name: string;
  greeting: string;
  auto_call: boolean;
};

const DEFAULTS: AssistantConfig = {
  assistant_name: "Ada",
  greeting: "",
  auto_call: false,
};

const NAME_MAX = 40;
const GREETING_MAX = 280;

export function AICallingSettings({
  companyId,
  canEdit,
  canActivate,
}: {
  companyId: string;
  canEdit: boolean;
  canActivate: boolean;
}) {
  const [config, setConfig] = useState<AssistantConfig>(DEFAULTS);
  const [saved, setSaved] = useState<AssistantConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    createClient()
      .from("ai_assistant_configs")
      .select("assistant_name, greeting, auto_call")
      .eq("company_id", companyId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const next = data
          ? {
              assistant_name: data.assistant_name,
              greeting: data.greeting,
              auto_call: data.auto_call,
            }
          : DEFAULTS;
        setConfig(next);
        setSaved(next);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const dirty = JSON.stringify(config) !== JSON.stringify(saved);
  const nameValid = config.assistant_name.trim().length > 0;

  const save = async () => {
    if (!canEdit || !dirty || !nameValid) return;
    setSaving(true);
    setStatus(null);

    const payload = {
      company_id: companyId,
      assistant_name: config.assistant_name.trim(),
      greeting: config.greeting.trim(),
      // Only store auto_call on if the company can actually use it
      auto_call: canActivate ? config.auto_call : false,
      updated_at: new Date().toISOString(),
    };

    const { error } = await createClient()
      .from("ai_assistant_configs")
      .upsert(payload, { onConflict: "company_id" });

    setSaving(false);

    if (error) {
      setStatus({ type: "error", text: "Couldn't save. Please try again." });
      return;
    }

    setSaved({ ...config, auto_call: payload.auto_call });
    setConfig((c) => ({ ...c, auto_call: payload.auto_call }));
    setStatus({ type: "ok", text: "Saved." });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm text-muted">
        <Spinner />
        Loading assistant…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuBot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Assistant</h2>
            <p className="mt-1 text-sm text-muted">
              {canActivate
                ? "Your assistant can call new enquiries automatically."
                : "Set up your assistant now. Auto-calls turn on with Pro and a verified company."}
            </p>
          </div>
        </div>
        <Badge variant="secondary">{canActivate ? "Pro" : "Draft"}</Badge>
      </div>

      <div className="mt-6 space-y-5">
        <Field label="Assistant name" hint={`${NAME_MAX} characters max`}>
          <input
            value={config.assistant_name}
            onChange={(e) =>
              setConfig({
                ...config,
                assistant_name: e.target.value.slice(0, NAME_MAX),
              })
            }
            disabled={!canEdit}
            className={inputClass}
          />
          {!nameValid && (
            <p className="mt-1 text-xs text-destructive">Name is required.</p>
          )}
        </Field>

        <Field
          label="Opening line"
          hint={`${config.greeting.length}/${GREETING_MAX}`}
        >
          <textarea
            value={config.greeting}
            onChange={(e) =>
              setConfig({
                ...config,
                greeting: e.target.value.slice(0, GREETING_MAX),
              })
            }
            disabled={!canEdit}
            rows={3}
            placeholder="Hi, this is Ada calling about the property you enquired about…"
            className={cn(inputClass, "resize-none")}
          />
        </Field>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Auto-call new enquiries
            </p>
            <p className="text-xs text-muted">
              {canActivate
                ? "Calls go out as soon as an enquiry is sent."
                : "Available on Pro, after verification."}
            </p>
          </div>
          <Toggle
            checked={config.auto_call}
            disabled={!canEdit || !canActivate}
            onChange={(checked) => setConfig({ ...config, auto_call: checked })}
            label="Auto-call new enquiries"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p
          role="status"
          className={cn(
            "text-xs",
            status?.type === "error" ? "text-destructive" : "text-muted",
          )}
        >
          {status?.text ?? (dirty ? "Unsaved changes" : "")}
        </p>

        {canEdit ? (
          <Button
            size="sm"
            onClick={save}
            disabled={!dirty || !nameValid || saving}
            isLoading={saving}
          >
            Save changes
          </Button>
        ) : (
          <p className="text-xs text-muted">
            Only company admins can edit this.
          </p>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
        {label}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted/40",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
