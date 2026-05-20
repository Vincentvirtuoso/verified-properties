/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/components/ui/Badge";
import {
  LuCircleCheck,
  LuHouse,
  LuBanknote,
  LuMapPin,
  LuImage,
  LuFileText,
  LuPencil,
} from "react-icons/lu";
import type {
  ListPropertyFormData,
  ListPropertyStep,
} from "../hooks/useListPropertyForm";

// ── Label helpers ──────────────────────────────────────────────────────────────

const PURPOSE_LABEL: Record<string, string> = {
  rent: "For Rent",
  sale: "For Sale",
};
const OWNER_LABEL: Record<string, string> = {
  agent: "Agent",
  landlord: "Landlord / Owner",
  company: "Company",
};
const CATEGORY_LABEL: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  land: "Land",
  mixedUse: "Mixed Use",
  hospitality: "Hospitality",
  institutional: "Institutional",
};
const FEATURE_LABEL: Record<string, string> = {
  boysQuarters: "Boys Quarters",
  penthouse: "Penthouse",
  garden: "Garden",
  smartHome: "Smart Home",
  furnished: "Furnished",
  serviced: "Serviced",
};

function formatPrice(price: string, currency: string) {
  const num = Number(price);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ReviewSection({
  title,
  icon: Icon,
  step,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ElementType;
  step: ListPropertyStep;
  onEdit: (step: ListPropertyStep) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </div>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <LuPencil className="h-3 w-3" />
          Edit
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground font-medium text-right">
        {value || "—"}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface StepReviewProps {
  formData: ListPropertyFormData;
  onEdit: (step: ListPropertyStep) => void;
  isSubmitting?: boolean;
}

export function StepReview({
  formData,
  onEdit,
  // isSubmitting,
}: StepReviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-5 rounded-xl bg-primary/5 border border-primary/20">
        <LuCircleCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Almost there — review your listing
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Check all details carefully before submitting. You can edit any
            section by clicking &quot;Edit&quot;.
          </p>
        </div>
      </div>

      <ReviewSection
        title="Basic Info"
        icon={LuHouse}
        step="basic"
        onEdit={onEdit}
      >
        <div className="divide-y divide-border">
          <Row label="Title" value={formData.title} />
          <Row
            label="Purpose"
            value={
              formData.listingPurpose
                ? PURPOSE_LABEL[formData.listingPurpose]
                : "—"
            }
          />
          <Row
            label="Your Role"
            value={formData.ownerType ? OWNER_LABEL[formData.ownerType] : "—"}
          />
          <Row
            label="Category"
            value={formData.category ? CATEGORY_LABEL[formData.category] : "—"}
          />
          <Row label="Type" value={formData.type || "—"} />
          {formData.description && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground line-clamp-4">
                {formData.description}
              </p>
            </div>
          )}
        </div>
      </ReviewSection>

      <ReviewSection
        title="Details & Price"
        icon={LuBanknote}
        step="details"
        onEdit={onEdit}
      >
        <div className="divide-y divide-border">
          <Row
            label="Price"
            value={
              <span className="font-semibold text-primary">
                {formatPrice(formData.price, formData.currency)}
                {formData.negotiable && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (Negotiable)
                  </span>
                )}
              </span>
            }
          />
          <Row
            label="Bedrooms"
            value={`${formData.bedrooms || "—"} bed${Number(formData.bedrooms) !== 1 ? "s" : ""}`}
          />
          <Row
            label="Bathrooms"
            value={`${formData.bathrooms || "—"} bath${Number(formData.bathrooms) !== 1 ? "s" : ""}`}
          />
          {formData.area && <Row label="Area" value={`${formData.area} sqm`} />}
          {formData.features.length > 0 && (
            <div className="pt-3">
              <p className="text-xs text-muted-foreground mb-2">Features</p>
              <div className="flex flex-wrap gap-1.5">
                {formData.features.map((f) => (
                  <Badge key={f} variant="secondary">
                    {FEATURE_LABEL[f] ?? f}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ReviewSection>

      <ReviewSection
        title="Location"
        icon={LuMapPin}
        step="location"
        onEdit={onEdit}
      >
        <div className="divide-y divide-border">
          <Row label="Address" value={formData.address} />
          <Row label="City" value={formData.city} />
          <Row label="State" value={formData.state} />
          <Row label="Country" value={formData.country} />
        </div>
      </ReviewSection>

      <ReviewSection
        title="Photos & Documents"
        icon={LuImage}
        step="media"
        onEdit={onEdit}
      >
        <div className="space-y-3">
          {formData.imageFiles.length > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                {formData.imageFiles.length} photo
                {formData.imageFiles.length !== 1 ? "s" : ""} uploaded
              </p>
              <div className="grid grid-cols-5 gap-2">
                {formData.imageFiles.slice(0, 10).map((file, i) => {
                  const url = URL.createObjectURL(file);
                  return (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                    >
                      <img
                        src={url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onLoad={() => URL.revokeObjectURL(url)}
                      />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[9px] font-semibold px-1 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                    </div>
                  );
                })}
                {formData.imageFiles.length > 10 && (
                  <div className="aspect-square rounded-lg bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground font-medium">
                    +{formData.imageFiles.length - 10}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No photos uploaded
            </p>
          )}

          {formData.videoLinks.some(Boolean) && (
            <div className="pt-1 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Video links</p>
              {formData.videoLinks.filter(Boolean).map((link, i) => (
                <p key={i} className="text-xs text-primary truncate">
                  {link}
                </p>
              ))}
            </div>
          )}

          {formData.documentFiles.length > 0 && (
            <div className="pt-1 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Documents</p>
              <div className="space-y-1.5">
                {formData.documentFiles.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <LuFileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate">
                      {doc.file.name}
                    </span>
                    {doc.type && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {doc.type}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ReviewSection>

      <p className="text-xs text-muted-foreground text-center px-4">
        By submitting, you confirm that all information is accurate and that you
        have the right to list this property. Your listing will be reviewed
        before going live.
      </p>
    </div>
  );
}
