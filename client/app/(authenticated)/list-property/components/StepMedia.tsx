"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { SectionHeader } from "@affilhomes/shared/ui/SectionHeader";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuFileText,
  LuImage,
  LuInfo,
  LuPlus,
  LuStar,
  LuUpload,
  LuVideo,
  LuX,
} from "react-icons/lu";
import type { ListPropertyFormData } from "../hooks/useListPropertyForm";
import {
  MEDIA_SECTIONS,
  type MediaSection,
  type PropertyDocumentType,
} from "@affilhomes/shared/types";
import { DOCUMENT_TYPES } from "@/utils";
import Select from "@affilhomes/shared/ui/Select";
import { PhotoDraftNotices } from "./PhotoDraftNotices";

const MAX_IMAGES = 20;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface StepMediaProps {
  formData: ListPropertyFormData;
  errors: Partial<Record<keyof ListPropertyFormData, string>>;
  updateField: <K extends keyof ListPropertyFormData>(
    key: K,
    value: ListPropertyFormData[K],
  ) => void;
  missingPhotoCount: number;
  photoSaveFailed: boolean;
}

function reorder<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function StepMedia({
  formData,
  updateField,
  errors,
  missingPhotoCount,
  photoSaveFailed,
}: StepMediaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const files = formData.imageFiles;
  const sections = formData.imageSections;
  const atLimit = files.length >= MAX_IMAGES;

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = (incoming: FileList | File[]) => {
    const problems: string[] = [];
    const valid: File[] = [];

    for (const file of Array.from(incoming)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        problems.push(`"${file.name}" is not a JPEG, PNG or WebP image`);
      } else if (file.size > MAX_BYTES) {
        problems.push(`"${file.name}" is larger than 10 MB`);
      } else {
        valid.push(file);
      }
    }

    const room = MAX_IMAGES - files.length;
    if (valid.length > room) {
      problems.push(
        room > 0
          ? `Only ${room} more photo${room === 1 ? " fits" : "s fit"}`
          : `You've reached the ${MAX_IMAGES}-photo limit`,
      );
    }

    const accepted = valid.slice(0, Math.max(room, 0));
    setFileErrors(problems);

    if (accepted.length > 0) {
      updateField("imageFiles", [...files, ...accepted]);
      updateField("imageSections", [
        ...sections,
        ...accepted.map(() => "general" as MediaSection),
      ]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement | HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    updateField(
      "imageFiles",
      files.filter((_, i) => i !== index),
    );
    updateField(
      "imageSections",
      sections.filter((_, i) => i !== index),
    );
    setFileErrors([]);
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    updateField("imageFiles", reorder(files, from, to));
    updateField("imageSections", reorder(sections, from, to));
  };

  const setImageSection = (index: number, section: MediaSection) => {
    updateField(
      "imageSections",
      sections.map((s, i) => (i === index ? section : s)),
    );
  };

  const toggleDocType = (type: PropertyDocumentType) => {
    const current = formData.documentTypes;
    updateField(
      "documentTypes",
      current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    );
  };

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          icon={LuImage}
          title="Property Photos"
          description={
            (files.length > 0
              ? `${files.length} of ${MAX_IMAGES} photos. The first photo is the cover.`
              : `Upload up to ${MAX_IMAGES} photos. The first photo becomes the cover.`) +
            " Photos are saved on this device only until you submit."
          }
        />

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {files.length === 0 ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            <LuUpload className="mb-2 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Drop photos here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG or WebP, up to 10 MB each
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {files.map((file, i) => {
              const isCover = i === 0;
              return (
                <div key={`${file.name}-${i}`} className="space-y-1.5">
                  <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30">
                    {previews[i] && (
                      <img
                        src={previews[i]}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    )}

                    {isCover && (
                      <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
                        Cover
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <LuX className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(i, i - 1)}
                      disabled={i === 0}
                      aria-label={`Move photo ${i + 1} earlier`}
                      className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <LuArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, i + 1)}
                      disabled={i === files.length - 1}
                      aria-label={`Move photo ${i + 1} later`}
                      className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <LuArrowRight className="h-3.5 w-3.5" />
                    </button>
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => moveImage(i, 0)}
                        className="ml-auto rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        Make cover
                      </button>
                    )}
                  </div>

                  <Select
                    value={sections[i] ?? "general"}
                    onChange={(value) =>
                      setImageSection(i, value as MediaSection)
                    }
                    options={MEDIA_SECTIONS}
                    showPlaceholder={false}
                  />
                </div>
              );
            })}

            {!atLimit && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              >
                <LuPlus className="h-5 w-5" />
                <span className="text-[11px] font-medium">Add more</span>
              </button>
            )}
          </div>
        )}

        {fileErrors.length > 0 && (
          <ul className="mt-3 space-y-1" role="alert">
            {fileErrors.map((msg) => (
              <li key={msg} className="text-xs text-destructive">
                {msg}
              </li>
            ))}
          </ul>
        )}
        {errors.imageFiles && (
          <p role="alert" className="mt-4 text-xs text-destructive">
            {errors.imageFiles}
          </p>
        )}

        <div className="mb-6">
          <PhotoDraftNotices
            missingPhotoCount={missingPhotoCount}
            photoSaveFailed={photoSaveFailed}
          />
        </div>
      </section>

      <section>
        <SectionHeader
          icon={LuVideo}
          title="Video Tour (Optional)"
          description="Add a video after saving, from My Listings."
        />
        <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
          <LuInfo className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <p className="text-sm text-muted">
            Our team reviews every video before it&apos;s posted on the
            Affilhomes YouTube channel.
          </p>
        </div>
      </section>

      <section>
        <SectionHeader
          icon={LuFileText}
          title="Ownership Documents (Optional)"
          description="Select the documents you have. You don't need to upload anything now. Our verification team will contact you to collect copies."
        />

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {DOCUMENT_TYPES.map(({ label, value }) => {
            const type = value as PropertyDocumentType;
            const isSelected = formData.documentTypes.includes(type);
            return (
              <button
                key={value}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => toggleDocType(type)}
                className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/40"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  }`}
                >
                  {isSelected && <LuCheck className="h-3.5 w-3.5" />}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {formData.documentTypes.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Your listing will show as &quot;Documents declared, pending
            verification.&quot;
          </p>
        )}
      </section>
    </div>
  );
}
