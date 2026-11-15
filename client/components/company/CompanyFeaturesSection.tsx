"use client";

import { useEffect, useState } from "react";
import { CompanyFeatures } from "@/types";
import { Button, Toggle } from "@affilhomes/shared/ui";
import { getErrorMessage } from "@/utils";
import { Alert } from "@affilhomes/shared/ui/Alert";

export function CompanyFeaturesSection({
  features,
  isPro,
  isOwner,
  canManageBilling,
  onWhatsappChange,
}: {
  features: CompanyFeatures;
  isPro: boolean;
  isOwner: boolean;
  canManageBilling: boolean;
  onWhatsappChange?: (enabled: boolean) => Promise<void>;
}) {
  const [whatsapp, setWhatsapp] = useState(features.whatsappNotifications);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWhatsapp(features.whatsappNotifications);
  }, [features.whatsappNotifications]);

  const canToggle = isPro && isOwner && !!onWhatsappChange;

  const toggleWhatsapp = async () => {
    if (!canToggle || saving) return;
    const next = !whatsapp;
    setWhatsapp(next);
    setSaving(true);
    setError(null);
    try {
      await onWhatsappChange!(next);
    } catch (err) {
      setWhatsapp(!next);
      setError(getErrorMessage(err, undefined, "detail"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Features</h2>
        <span className="text-xs text-muted">{isPro ? "Pro" : "Standard"}</span>
      </div>

      {!isPro && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted">
          <span>These need an AI plan.</span>
          {canManageBilling ? (
            <Button href="/company/ai-plans" size="xs" variant="outline">
              Choose a plan
            </Button>
          ) : (
            <span className="text-xs">
              Ask someone with billing access to choose a plan.
            </span>
          )}
        </div>
      )}

      <ul className="divide-y divide-border border-t border-border">
        <li className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="text-sm text-foreground">WhatsApp notifications</p>
            <p className="text-xs text-muted">
              Send new enquiry alerts to your team's WhatsApp.
            </p>
            {error && <Alert className="text-xs p-2 mt-2">{error}</Alert>}
          </div>
          {canToggle ? (
            <Toggle
              aria-checked={whatsapp}
              aria-label="WhatsApp notifications"
              label="WhatsApp notifications"
              checked={whatsapp}
              disabled={saving}
              onChange={toggleWhatsapp}
            />
          ) : (
            <span className="text-xs text-muted">
              {!isPro ? "Pro" : whatsapp ? "On" : "Off"}
            </span>
          )}
        </li>

        <li className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="text-sm text-foreground">Priority support</p>
            <p className="text-xs text-muted">
              Faster responses from the Affilhomes support team.
            </p>
          </div>
          <span className="text-xs text-muted">
            {features.prioritySupport ? "Included" : "Pro"}
          </span>
        </li>
      </ul>
    </section>
  );
}
