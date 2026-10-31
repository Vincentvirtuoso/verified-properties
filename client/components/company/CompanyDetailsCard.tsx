"use client";

import { useState } from "react";
import { LuBuilding2, LuMail, LuPencil, LuPhone } from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa";

import { createClient } from "@affilhomes/shared/supabase/client";
import { Button, Field } from "@affilhomes/shared/ui";
import { InfoRow } from "@affilhomes/shared/ui/InfoRow";
import { formatPhoneNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type Details = {
  contactEmail: string;
  contactPhone?: string | null;
  whatsappNumber?: string | null;
};

type Draft = {
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{10,15}$/;

function normalizePhone(value: string) {
  return value.replace(/[\s\-()]/g, "");
}

function validate(draft: Draft): Partial<Record<keyof Draft, string>> {
  const errors: Partial<Record<keyof Draft, string>> = {};

  if (!EMAIL_RE.test(draft.contactEmail.trim())) {
    errors.contactEmail = "Enter a valid email address.";
  }

  const phone = normalizePhone(draft.contactPhone);
  if (phone && !PHONE_RE.test(phone)) {
    errors.contactPhone = "Enter 10 to 15 digits, with an optional +.";
  }

  const whatsapp = normalizePhone(draft.whatsappNumber);
  if (whatsapp && !PHONE_RE.test(whatsapp)) {
    errors.whatsappNumber = "Enter 10 to 15 digits, with an optional +.";
  }

  return errors;
}

export function CompanyDetailsCard({
  companyId,
  companyName,
  details,
  canEdit,
  onSaved,
}: {
  companyId: string;
  companyName: string;
  details: Details;
  canEdit: boolean;
  onSaved?: (next: Details) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(toDraft(details));
  const [touched, setTouched] = useState<Partial<Record<keyof Draft, boolean>>>(
    {},
  );

  const errors = validate(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const dirty =
    draft.contactEmail.trim() !== details.contactEmail ||
    normalizePhone(draft.contactPhone) !==
      normalizePhone(details.contactPhone ?? "") ||
    normalizePhone(draft.whatsappNumber) !==
      normalizePhone(details.whatsappNumber ?? "");

  const startEditing = () => {
    setDraft(toDraft(details));
    setTouched({});
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    setTouched({
      contactEmail: true,
      contactPhone: true,
      whatsappNumber: true,
    });
    if (hasErrors || !dirty) return;

    const next: Details = {
      contactEmail: draft.contactEmail.trim(),
      contactPhone: normalizePhone(draft.contactPhone) || null,
      whatsappNumber: normalizePhone(draft.whatsappNumber) || null,
    };

    setSaving(true);
    setError(null);

    // Column names are assumed to be snake_case. Match them to your schema.
    const { error: updateError } = await createClient()
      .from("companies")
      .update({
        contact_email: next.contactEmail,
        contact_phone: next.contactPhone,
        whatsapp_number: next.whatsappNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    setSaving(false);

    if (updateError) {
      setError("Couldn't save your changes. Please try again.");
      return;
    }

    onSaved?.(next);
    setEditing(false);
  };

  const fieldProps = (key: keyof Draft) => ({
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    "aria-invalid": Boolean(touched[key] && errors[key]),
    "aria-describedby":
      touched[key] && errors[key] ? `${key}-error` : undefined,
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LuBuilding2 className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Company details</h2>
        </div>

        {canEdit && !editing && (
          <Button
            variant="ghost"
            size="xs"
            onClick={startEditing}
            leftIcon={<LuPencil className="h-3.5 w-3.5" />}
          >
            Edit
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-1">
          <InfoRow
            icon={LuBuilding2}
            label="Company name"
            value={companyName}
          />
          <InfoRow
            icon={LuMail}
            label="Contact email"
            value={details.contactEmail}
            mono
          />
          <InfoRow
            icon={LuPhone}
            label="Contact phone"
            value={
              details.contactPhone
                ? formatPhoneNumber(details.contactPhone)
                : null
            }
            mono
          />
          <InfoRow
            icon={FaWhatsapp}
            label="WhatsApp"
            value={
              details.whatsappNumber
                ? formatPhoneNumber(details.whatsappNumber)
                : null
            }
            mono
          />
          {!canEdit && (
            <p className="pt-3 text-xs text-muted">
              Only company admins can change these details.
            </p>
          )}
        </div>
      ) : (
        <form
          className="space-y-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <ReadOnlyField
            label="Company name"
            value={companyName}
            hint="Locked after registration"
          />

          <Field
            id="contactEmail"
            label="Contact email"
            error={touched.contactEmail ? errors.contactEmail : undefined}
            type="email"
            autoComplete="email"
            value={draft.contactEmail}
            onChange={(e) =>
              setDraft({ ...draft, contactEmail: e.target.value })
            }
            {...fieldProps("contactEmail")}
          />

          <Field
            id="contactPhone"
            label="Contact phone"
            // hint="Optional"
            error={touched.contactPhone ? errors.contactPhone : undefined}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+234 801 234 5678"
            value={draft.contactPhone}
            onChange={(e) =>
              setDraft({ ...draft, contactPhone: e.target.value })
            }
            {...fieldProps("contactPhone")}
          />

          <Field
            label="WhatsApp"
            error={touched.whatsappNumber ? errors.whatsappNumber : undefined}
            id="whatsappNumber"
            type="tel"
            inputMode="tel"
            placeholder="+234 801 234 5678"
            value={draft.whatsappNumber}
            onChange={(e) =>
              setDraft({ ...draft, whatsappNumber: e.target.value })
            }
            {...fieldProps("whatsappNumber")}
          />

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!dirty || hasErrors || saving}
              isLoading={saving}
            >
              Save changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function toDraft(d: Details): Draft {
  return {
    contactEmail: d.contactEmail ?? "",
    contactPhone: d.contactPhone ?? "",
    whatsappNumber: d.whatsappNumber ?? "",
  };
}

function inputClass(invalid: boolean) {
  return cn(
    "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring",
    invalid ? "border-destructive" : "border-border",
  );
}

function ReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
        {label}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </p>
      <p className="rounded-lg border border-dashed border-border bg-muted/10 px-3 py-2 text-sm text-muted">
        {value}
      </p>
    </div>
  );
}
