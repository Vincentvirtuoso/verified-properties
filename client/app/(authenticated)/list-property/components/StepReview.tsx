/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@affilhomes/shared/ui/Badge";
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
import {
  DOCUMENT_TYPES,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_FEATURE_LABELS,
} from "@/utils";
import { useEffect, useState } from "react";
import { PhotoDraftNotices } from "./PhotoDraftNotices";
import { VerifiedBadge } from "@affilhomes/shared/ui";

const PURPOSE_LABEL: Record<string, string> = {
  rent: "For Rent",
  sale: "For Sale",
};
const OWNER_LABEL: Record<string, string> = {
  agent: "Agent",
  landlord: "Landlord / Owner",
  company: "Company",
};

const DOC_LABEL: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map(({ value, label }) => [value, label]),
);

function formatPrice(price: string, currency: string) {
  const num = Number(price);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

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
          className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
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
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-foreground font-medium text-right">
        {value || "—"}
      </span>
    </div>
  );
}

interface StepReviewProps {
  formData: ListPropertyFormData;
  onEdit: (step: ListPropertyStep) => void;
  isSubmitting?: boolean;
  missingPhotoCount: number;
  photoSaveFailed: boolean;
}

export function StepReview({
  formData,
  onEdit,
  missingPhotoCount,
  photoSaveFailed,
}: StepReviewProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = formData.imageFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [formData.imageFiles]);
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-5 rounded-xl bg-primary/5 border border-primary/20">
        <LuCircleCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Almost there — review your listing
          </p>
          <p className="text-xs text-muted mt-0.5">
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
            value={
              formData.category
                ? PROPERTY_CATEGORY_LABELS[formData.category]
                : "—"
            }
          />
          <Row label="Type" value={formData.type || "—"} />
          {formData.description && (
            <div className="pt-2">
              <p className="text-xs text-muted mb-1">Description</p>
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
                  <span className="ml-2 text-xs font-normal text-muted">
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
              <p className="text-xs text-muted mb-2">Features</p>
              <div className="flex flex-wrap gap-1.5">
                {formData.features.map((f) => (
                  <Badge key={f} variant="secondary">
                    {PROPERTY_FEATURE_LABELS[f] ?? f}
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
          {formData.coordinates && (
            <Row
              label="Map Pin"
              value={`${formData.coordinates.lat.toFixed(5)}, ${formData.coordinates.lng.toFixed(5)}`}
            />
          )}
        </div>
      </ReviewSection>

      <ReviewSection
        title="Photos & Documents"
        icon={LuImage}
        step="media"
        onEdit={onEdit}
      >
        <div className="space-y-3">
          <PhotoDraftNotices
            missingPhotoCount={missingPhotoCount}
            photoSaveFailed={photoSaveFailed}
          />

          {formData.imageFiles.length > 0 ? (
            <div>
              <p className="mb-2 text-xs text-muted">
                {formData.imageFiles.length} photo
                {formData.imageFiles.length !== 1 ? "s" : ""} added
              </p>
              <div className="grid grid-cols-5 gap-2">
                {previews.slice(0, 10).map((url, i) => (
                  <div
                    key={url}
                    className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <img
                      src={url}
                      alt={formData.imageFiles[i]?.name ?? ""}
                      className="h-full w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-primary px-1 py-0.5 text-[9px] font-semibold text-primary-foreground">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {formData.imageFiles.length > 10 && (
                  <div className="flex aspect-square items-center justify-center rounded-lg border border-border bg-muted text-xs font-medium text-muted">
                    +{formData.imageFiles.length - 10}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-muted">No photos added</p>
          )}

          {formData.documentTypes.length > 0 ? (
            <div className="border-t border-border pt-3">
              <div className="mb-2 flex items-start gap-2">
                <VerifiedBadge
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  showText={false}
                />
                <p className="text-xs text-muted">
                  Documents declared, pending verification. Our team will be in
                  touch to collect and review them. The Ownership documents row
                  on your listing will update as the review progresses.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.documentTypes.map((type) => (
                  <Badge key={type} variant="outline" className="text-[10px]">
                    <LuFileText className="mr-1 inline h-3 w-3" />
                    {DOC_LABEL[type] ?? type}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="border-t border-border pt-1 text-xs text-muted">
              Add ownership documents to show buyers this property has been
              checked. Our team will contact you to collect them. Your listing
              stays live in the meantime.
            </p>
          )}
        </div>
      </ReviewSection>

      <p className="text-xs text-muted text-center px-4">
        By submitting, you confirm that all information is accurate and that you
        have the right to list this property. Your listing will be reviewed
        before going live.
      </p>
    </div>
  );
}
