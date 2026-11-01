"use client";

import { useEffect, useState } from "react";
import { LuBot } from "react-icons/lu";

import { createClient } from "@affilhomes/shared/supabase/client";
import { Badge, Button, Textarea } from "@affilhomes/shared/ui";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton";
import { cn } from "@/lib/utils";
import { Toggle, Field as Input } from "@affilhomes/shared/ui";

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

function FieldSkeleton({
  label,
  height = "h-9",
  multiline = false,
}: {
  label: string;
  height?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton
        className={cn(height, "w-full rounded-lg", multiline && "h-18.5")}
      />
      <span className="sr-only">Loading {label}</span>
    </div>
  );
}

function AssistantSettingsSkeleton() {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      aria-busy="true"
      aria-label="Loading assistant settings"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3.5 w-64 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-12 shrink-0 rounded-full" />
      </div>

      <div className="mt-6 space-y-5">
        <FieldSkeleton label="assistant name" />
        <FieldSkeleton label="opening line" multiline />

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52 max-w-full" />
          </div>
          <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
    </div>
  );
}

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

  if (loading) return <AssistantSettingsSkeleton />;

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
          <Input
            label="Assistant name"
            hint={`${NAME_MAX} characters max`}
            value={config.assistant_name}
            onChange={(e) =>
              setConfig({
                ...config,
                assistant_name: e.target.value.slice(0, NAME_MAX),
              })
            }
            disabled={!canEdit}
          />
          {!nameValid && (
            <p className="mt-1 text-xs text-destructive">Name is required.</p>
          )}

        <Textarea
          label="Opening line"
          value={config.greeting}
          onChange={(value) =>
            setConfig({
              ...config,
              greeting: value.slice(0, GREETING_MAX),
            })
          }
          maxLength={GREETING_MAX}
          disabled={!canEdit}
          rows={3}
          placeholder="Hi, this is Ada calling about the property you enquired about…"
        />

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

