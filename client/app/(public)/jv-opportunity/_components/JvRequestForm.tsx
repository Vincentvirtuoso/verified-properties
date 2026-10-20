"use client";

import { type SubmitEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@affilhomes/shared/ui/Button";
import { Field } from "@affilhomes/shared/ui/Field";
import { Textarea } from "@affilhomes/shared/ui/Textarea";
import Select from "@affilhomes/shared/ui/Select";
import {
  REQUEST_TYPES,
  STRATEGY_LABELS,
  type JvStrategy,
} from "@/data/jv-requests";
import { FiAlertCircle, FiEyeOff, FiMapPin } from "react-icons/fi";
import { formatNaira } from "@/utils";
import { JvRequestPayload } from "@/lib/jv-api";

export const MIN_DESCRIPTION = 30;
export const MAX_DESCRIPTION = 1500;
export const MAX_AREA = 80;

export type JvRequestFormValues = {
  area: string;
  requestType: string;
  budgetMin: string;
  budgetMax: string;
  strategyPreference: JvStrategy;
  description: string;
};

type FieldErrors = Partial<Record<keyof JvRequestFormValues, string>>;

const ERROR_ORDER: (keyof JvRequestFormValues)[] = [
  "area",
  "budgetMin",
  "budgetMax",
  "description",
];

const DEFAULT_VALUES: JvRequestFormValues = {
  area: "",
  requestType: (REQUEST_TYPES[0] as string) ?? "",
  budgetMin: "",
  budgetMax: "",
  strategyPreference: "equity_partnership",
  description: "",
};

const parseNaira = (input: string) => input.replace(/[^\d]/g, "");

function validate(form: JvRequestFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const area = form.area.trim();
  if (!area) errors.area = "Enter the area you're focused on.";
  else if (area.length < 3) errors.area = "Enter a more specific area.";

  const min = Number(form.budgetMin);
  const max = Number(form.budgetMax);

  if (!form.budgetMin) errors.budgetMin = "Enter a minimum budget.";
  else if (!Number.isFinite(min) || min <= 0)
    errors.budgetMin = "Enter a valid amount.";

  if (!form.budgetMax) errors.budgetMax = "Enter a maximum budget.";
  else if (!Number.isFinite(max) || max <= 0)
    errors.budgetMax = "Enter a valid amount.";

  if (!errors.budgetMin && !errors.budgetMax && max < min)
    errors.budgetMax = "Maximum must be at least the minimum.";

  const desc = form.description.trim();
  if (!desc) errors.description = "Describe what you're looking for.";
  else if (desc.length < MIN_DESCRIPTION)
    errors.description = `Add a bit more detail (at least ${MIN_DESCRIPTION} characters).`;

  return errors;
}

interface JvRequestFormProps {
  initialValues?: Partial<JvRequestFormValues>;
  submitLabel: string;
  submitLoadingLabel: string;
  submitting: boolean;
  apiError: string | null;
  onSubmit: (payload: JvRequestPayload) => void | Promise<void>;
  cancelHref: string;
}

export function JvRequestForm({
  initialValues,
  submitLabel,
  submitLoadingLabel,
  submitting,
  apiError,
  onSubmit,
  cancelHref,
}: JvRequestFormProps) {
  const [form, setForm] = useState<JvRequestFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const update = <K extends keyof JvRequestFormValues>(
    key: K,
    value: JvRequestFormValues[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const firstErrorField = useMemo(() => {
    if (!submitAttempted) return null;
    return ERROR_ORDER.find((k) => errors[k]) ?? null;
  }, [submitAttempted, errors]);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitAttempted(true);
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      area: form.area.trim(),
      requestType: form.requestType,
      budgetMin: Number(form.budgetMin),
      budgetMax: Number(form.budgetMax),
      strategyPreference: form.strategyPreference,
      description: form.description.trim(),
    });
  };

  const requestTypeOptions = REQUEST_TYPES.map((t) => ({ value: t, label: t }));
  const strategyOptions = (Object.keys(STRATEGY_LABELS) as JvStrategy[]).map(
    (s) => ({ value: s, label: STRATEGY_LABELS[s] }),
  );

  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <FiEyeOff className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
        <p className="text-sm text-muted">
          Your name and contact details stay hidden from subscribers until you
          accept a response.
        </p>
      </div>

      <Field
        label="Area (state / LGA)"
        name="area"
        placeholder="e.g. Lagos, Ibeju-Lekki"
        icon={FiMapPin}
        value={form.area}
        onChange={(e) => update("area", e.target.value)}
        required
        maxLength={MAX_AREA}
        autoComplete="off"
        error={errors.area}
        scrollOnError={firstErrorField === "area"}
        focusOnError={firstErrorField === "area"}
      />

      <Select
        label="Request type"
        options={requestTypeOptions}
        value={form.requestType}
        onChange={(v) => update("requestType", v)}
        required
        showPlaceholder={false}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Budget min (₦)"
          name="budgetMin"
          placeholder="e.g. 5,000,000"
          inputMode="numeric"
          value={formatNaira(form.budgetMin)}
          onChange={(e) => update("budgetMin", parseNaira(e.target.value))}
          required
          error={errors.budgetMin}
          scrollOnError={firstErrorField === "budgetMin"}
          focusOnError={firstErrorField === "budgetMin"}
        />
        <Field
          label="Budget max (₦)"
          name="budgetMax"
          placeholder="e.g. 20,000,000"
          inputMode="numeric"
          value={formatNaira(form.budgetMax)}
          onChange={(e) => update("budgetMax", parseNaira(e.target.value))}
          required
          error={errors.budgetMax}
          scrollOnError={firstErrorField === "budgetMax"}
          focusOnError={firstErrorField === "budgetMax"}
        />
      </div>

      <Select
        label="Preferred strategy"
        options={strategyOptions}
        value={form.strategyPreference}
        onChange={(v) => update("strategyPreference", v as JvStrategy)}
        required
        showPlaceholder={false}
      />

      <Textarea
        label="Description"
        name="description"
        value={form.description}
        onChange={(v) => update("description", v)}
        placeholder="What you have, what you need, and any timeline."
        required
        rows={5}
        maxLength={MAX_DESCRIPTION}
        showCount
        error={errors.description}
      />

      {apiError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{apiError}</p>
        </div>
      )}

      {!apiError && submitAttempted && errorCount > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {errorCount === 1
              ? "Please fix the highlighted field above."
              : `Please fix the ${errorCount} highlighted fields above.`}
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button variant="outline" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          isLoading={submitting}
          loadingText={submitLoadingLabel}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
