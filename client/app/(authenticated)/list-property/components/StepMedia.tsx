"use client";

import { useRef, ChangeEvent } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import {
  LuImage,
  LuVideo,
  LuFileText,
  LuX,
  LuPlus,
  LuUpload,
} from "react-icons/lu";
import type { ListPropertyFormData } from "../hooks/useListPropertyForm";
import type { PropertyDocumentType } from "@/types";
import Image from "next/image";

const DOCUMENT_TYPES: { value: PropertyDocumentType; label: string }[] = [
  {
    value: "certificateOfOccupancy",
    label: "Certificate of Occupancy (C of O)",
  },
  { value: "governorsConsent", label: "Governor's Consent" },
  { value: "deedOfAssignment", label: "Deed of Assignment" },
  { value: "surveyPlan", label: "Survey Plan" },
  { value: "approvedBuildingPlan", label: "Approved Building Plan" },
  { value: "contractOfSale", label: "Contract of Sale" },
  { value: "powerOfAttorney", label: "Power of Attorney" },
  { value: "landPurchaseAgreement", label: "Land Purchase Agreement" },
  { value: "taxClearanceCertificate", label: "Tax Clearance Certificate" },
  { value: "gazette", label: "Gazette" },
  { value: "letterOfAllocation", label: "Letter of Allocation" },
  { value: "receiptOfPaymentForLand", label: "Receipt of Payment for Land" },
  { value: "excisionDocument", label: "Excision Document" },
  { value: "deedOfSublease", label: "Deed of Sublease" },
  { value: "deedOfMortgage", label: "Deed of Mortgage" },
  { value: "registeredSurveyPlan", label: "Registered Survey Plan" },
  {
    value: "certificateOfStatutoryRightOfOccupancy",
    label: "Statutory Right of Occupancy",
  },
  { value: "affidavitOfLoss", label: "Affidavit of Loss" },
  {
    value: "probateLetterOfAdministration",
    label: "Probate / Letter of Administration",
  },
  {
    value: "irrevocablePowerOfAttorney",
    label: "Irrevocable Power of Attorney",
  },
  { value: "deedOfLease", label: "Deed of Lease" },
  { value: "deedOfSurrender", label: "Deed of Surrender" },
  { value: "deedOfGift", label: "Deed of Gift" },
  { value: "deedOfConveyance", label: "Deed of Conveyance" },
];

interface StepMediaProps {
  formData: ListPropertyFormData;
  updateField: <K extends keyof ListPropertyFormData>(
    key: K,
    value: ListPropertyFormData[K],
  ) => void;
}

export function StepMedia({ formData, updateField }: StepMediaProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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

  const updateVideoLink = (index: number, value: string) => {
    const next = [...formData.videoLinks];
    next[index] = value;
    updateField("videoLinks", next);
  };

  const addVideoLink = () => {
    updateField("videoLinks", [...formData.videoLinks, ""]);
  };

  const removeVideoLink = (index: number) => {
    updateField(
      "videoLinks",
      formData.videoLinks.filter((_, i) => i !== index),
    );
  };

  const handleDocFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files).map((file) => ({
      file,
      type: "" as PropertyDocumentType | "",
    }));
    updateField("documentFiles", [...formData.documentFiles, ...incoming]);
    e.target.value = "";
  };

  const updateDocType = (index: number, type: PropertyDocumentType | "") => {
    const next = [...formData.documentFiles];
    next[index] = { ...next[index], type };
    updateField("documentFiles", next);
  };

  const removeDoc = (index: number) => {
    updateField(
      "documentFiles",
      formData.documentFiles.filter((_, i) => i !== index),
    );
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
          title="Video Tours (Optional)"
          description="Add YouTube or other video links to give a virtual tour"
        />
        <div className="space-y-3">
          {formData.videoLinks.map((link, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1">
                <Field
                  label={i === 0 ? "Video URL" : ""}
                  name={`video_${i}`}
                  placeholder="https://youtube.com/watch?v=..."
                  value={link}
                  onChange={(e) => updateVideoLink(i, e.target.value)}
                />
              </div>
              {formData.videoLinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVideoLink(i)}
                  className={`self-end mb-0 p-2.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors ${i === 0 ? "mt-7" : ""}`}
                  aria-label="Remove video"
                >
                  <LuX className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {formData.videoLinks.length < 5 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<LuPlus className="h-4 w-4" />}
              onClick={addVideoLink}
            >
              Add video link
            </Button>
          )}
        </div>
      </section>

      <section>
        <SectionHeader
          icon={LuFileText}
          title="Property Documents (Optional)"
          description="Upload title documents to increase buyer confidence"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<LuUpload className="h-4 w-4" />}
          onClick={() => docInputRef.current?.click()}
          className="mb-4"
        >
          Upload documents
        </Button>
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          onChange={handleDocFiles}
          className="hidden"
        />

        {formData.documentFiles.length > 0 && (
          <div className="space-y-3">
            {formData.documentFiles.map((doc, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <LuFileText className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {doc.file.name}
                  </p>
                  <select
                    value={doc.type}
                    onChange={(e) =>
                      updateDocType(
                        i,
                        e.target.value as PropertyDocumentType | "",
                      )
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="">Select document type…</option>
                    {DOCUMENT_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => removeDoc(i)}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remove document"
                >
                  <LuX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
