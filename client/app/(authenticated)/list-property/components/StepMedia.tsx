"use client";

import { useRef, ChangeEvent } from "react";
import { SectionHeader } from "@affilhomes/shared/ui/SectionHeader";
import {
  LuImage,
  LuVideo,
  LuFileText,
  LuX,
  LuUpload,
  LuShieldCheck,
} from "react-icons/lu";
import type { ListPropertyFormData } from "../hooks/useListPropertyForm";
import type { PropertyDocumentType } from "@affilhomes/shared/types";
import Image from "next/image";
import { DOCUMENT_TYPES } from "@/utils";

interface StepMediaProps {
  formData: ListPropertyFormData;
  updateField: <K extends keyof ListPropertyFormData>(
    key: K,
    value: ListPropertyFormData[K],
  ) => void;
}

export function StepMedia({ formData, updateField }: StepMediaProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    updateField(
      "imageFiles",
      [...formData.imageFiles, ...incoming].slice(0, 20),
    );
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    updateField(
      "imageFiles",
      formData.imageFiles.filter((_, i) => i !== index),
    );
  };

  const toggleDocType = (type: PropertyDocumentType) => {
    const current = formData.documentTypes;
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateField("documentTypes", next);
  };

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          icon={LuImage}
          title="Property Photos"
          description="Upload up to 20 photos. The first photo will be your cover image."
        />

        <div
          onClick={() => imageInputRef.current?.click()}
          className="group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageFiles}
            className="hidden"
          />
          <LuUpload className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
          <p className="text-sm font-medium text-foreground">
            Click to upload photos
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG, WebP — max 10MB each
          </p>
        </div>

        {formData.imageFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
            {formData.imageFiles.map((file, i) => {
              const url = URL.createObjectURL(file);
              return (
                <div
                  key={i}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                >
                  <Image
                    src={url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onLoad={() => URL.revokeObjectURL(url)}
                    fill
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <LuX className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          icon={LuVideo}
          title="Video Tour (Optional)"
          description="After saving, upload a video file from My Listings. Our team reviews every video before it's posted on the Affilhomes YouTube channel."
        />
      </section>

      <section>
        <SectionHeader
          icon={LuFileText}
          title="Ownership Documents (Optional)"
          description="Select which documents you have for this property. You don't need to upload anything now — our verification team will reach out separately to collect copies."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DOCUMENT_TYPES.map(({ label, value }) => {
            const isSelected = formData.documentTypes.includes(
              value as PropertyDocumentType,
            );
            return (
              <label
                key={value}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleDocType(value as PropertyDocumentType)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring shrink-0"
                />
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
              </label>
            );
          })}
        </div>

        {formData.documentTypes.length > 0 && (
          <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <LuShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {formData.documentTypes.length} document
                {formData.documentTypes.length !== 1 ? "s" : ""} declared
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your listing will show as &quot;Documents declared — pending
                verification&quot; once published. A verification team member
                will contact you to collect copies and complete the review.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
