"use client";

import { useMemo, useState } from "react";
import { FaFileImport, FaImages } from "react-icons/fa";
import { Button } from "./Button";
import {
  ListingPurpose,
  MEDIA_SECTIONS,
  MediaSection,
  PinVisibility,
  PROPERTY_MEDIA_SECTIONS,
  PropertyCategory,
  PropertyDocumentType,
  PropertyFeature,
  PropertyType,
} from "../types";
import { useConfirm } from "./ConfirmDialog";
import {
  PROPERTY_CATEGORIES,
  PROPERTY_FEATURES,
  PROPERTY_TYPES,
} from "../utils";
import { LuChevronDown, LuCircleCheck, LuTriangleAlert } from "react-icons/lu";

const LISTING_TYPES: ListingPurpose[] = ["sale", "rent"];
const PIN_VISIBILITY: PinVisibility[] = ["public", "private"];

export type ImportedListing = {
  title: string;
  listingPurpose?: ListingPurpose;
  category?: PropertyCategory;
  type?: PropertyType;
  price?: number;
  currency?: string;
  negotiable?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  description?: string;
  features?: PropertyFeature[];
  documents?: PropertyDocumentType[];
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    coordinates?: { lat: number; lng: number; pin_visibility?: PinVisibility };
  };
  photos?: { ref: string; section?: MediaSection }[];
};

export type ListingFormPatch = {
  basic: {
    title: string;
    listingPurpose?: ListingPurpose;
    category?: PropertyCategory;
    type?: PropertyType;
    price?: number;
    currency?: string;
    negotiable?: boolean;
    description?: string;
  };
  details: {
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    features: PropertyFeature[];
  };
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lng?: number;
    pinVisibility?: PinVisibility;
  };
  documents: PropertyDocumentType[];
  photos: { file: File; section?: MediaSection }[];
};

type Match = {
  ref: string;
  rawSection?: MediaSection;
  section?: MediaSection;
  sectionValid: boolean;
  file?: File;
};

type Props = {
  documentTypes: PropertyDocumentType[];
  sectionOptions: string[];
  onApply: (patch: ListingFormPatch) => void;
  hasExistingInput?: boolean;
  onClose?: () => void;
};

const FEATURE_BY_LABEL = new Map(
  PROPERTY_FEATURES.map((f) => [f.label.toLowerCase(), f.value]),
);

function resolveFeatures(input: string[]): {
  matched: PropertyFeature[];
  unmatched: string[];
} {
  const matched = new Set<PropertyFeature>();
  const unmatched: string[] = [];

  for (const raw of input) {
    const key = raw.trim().toLowerCase();
    const value =
      FEATURE_BY_LABEL.get(key) ?? (isFeatureValue(raw) ? raw : undefined);
    if (value) matched.add(value);
    else unmatched.push(raw);
  }

  return { matched: [...matched], unmatched };
}

function isFeatureValue(s: string): s is PropertyFeature {
  return PROPERTY_FEATURES.some((f) => f.value === s);
}
const SECTION_SET = new Set<string>(PROPERTY_MEDIA_SECTIONS);

function resolveSection(raw: string | undefined): {
  section?: string;
  valid: boolean;
} {
  if (!raw) return { section: undefined, valid: true };
  const trimmed = raw.trim();
  return SECTION_SET.has(trimmed)
    ? { section: trimmed, valid: true }
    : { valid: false };
}

function validate(raw: unknown): {
  listing: ImportedListing | null;
  errors: string[];
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      listing: null,
      errors: ["The file must contain one JSON object."],
    };
  }

  const r = raw as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof r.title !== "string" || !r.title.trim()) {
    errors.push("`title` is required.");
  }
  if (
    r.listingPurpose != null &&
    !LISTING_TYPES.includes(r.listingPurpose as never)
  ) {
    errors.push(
      `\`listingPurpose\` must be one of: ${LISTING_TYPES.join(", ")}.`,
    );
  }
  if (r.type != null && !PROPERTY_TYPES.includes(r.type as PropertyType)) {
    errors.push(
      `\`type\` "${String(r.type)}" is not a valid property type. Use one of the listed values, for example "detachedDuplex".`,
    );
  }
  if (
    r.category != null &&
    !PROPERTY_CATEGORIES.includes(r.category as PropertyCategory)
  ) {
    errors.push(
      `\`category\` "${String(r.category)}" is not a valid property category. Use one of the listed values, for example "detachedDuplex".`,
    );
  }
  if (r.price != null && (typeof r.price !== "number" || r.price <= 0)) {
    errors.push("`price` must be a positive number.");
  }
  for (const key of ["bedrooms", "bathrooms"] as const) {
    const v = r[key];
    if (v != null && (!Number.isInteger(v) || (v as number) < 0)) {
      errors.push(`\`${key}\` must be a whole number.`);
    }
  }
  if (r.area != null && (typeof r.area !== "number" || r.area <= 0)) {
    errors.push("`area` must be a positive number.");
  }
  if (r.location != null) {
    const loc = r.location as {
      coordinates?: { lat?: unknown; lng?: unknown; pin_visibility?: unknown };
    };
    const c = loc.coordinates;
    if (c != null) {
      if (typeof c.lat !== "number" || c.lat < -90 || c.lat > 90) {
        errors.push("`location.coordinates.lat` must be between -90 and 90.");
      }
      if (typeof c.lng !== "number" || c.lng < -180 || c.lng > 180) {
        errors.push("`location.coordinates.lng` must be between -180 and 180.");
      }
      if (
        c.pin_visibility != null &&
        !PIN_VISIBILITY.includes(c.pin_visibility as never)
      ) {
        errors.push(
          "`location.coordinates.pin_visibility` must be public or private.",
        );
      }
    }
  }
  for (const key of ["features", "documents"] as const) {
    const v = r[key];
    if (
      v != null &&
      (!Array.isArray(v) || v.some((x) => typeof x !== "string"))
    ) {
      errors.push(`\`${key}\` must be a list of strings.`);
    }
  }
  if (r.photos != null) {
    if (!Array.isArray(r.photos)) {
      errors.push("`photos` must be a list.");
    } else if (
      r.photos.some((p) => typeof (p as { ref?: unknown })?.ref !== "string")
    ) {
      errors.push("Each photo needs a `ref` (its filename).");
    }
  }

  if (errors.length) return { listing: null, errors };
  return { listing: r as unknown as ImportedListing, errors };
}

function getWarnings(
  listing: ImportedListing,
  matches: Match[],
  documentTypes: PropertyDocumentType[],
  sectionOptions: string[],
): string[] {
  const warnings: string[] = [];

  const unknownDocs = (listing.documents ?? []).filter(
    (d) => !documentTypes.includes(d),
  );
  if (unknownDocs.length) {
    warnings.push(`Skipped unknown document types: ${unknownDocs.join(", ")}.`);
  }
  if (!listing.location) {
    warnings.push(
      "No map pin in the file. You'll need to place the exact pin before submitting.",
    );
  }
  const { unmatched } = resolveFeatures(listing.features ?? []);
  if (unmatched.length) {
    warnings.push(
      `These features don't match any feature in the listing form and were not applied: ${unmatched.join(", ")}.`,
    );
  }
  const rejectedPhotos = matches.filter((m) => m.file && !m.sectionValid);
  if (rejectedPhotos.length) {
    warnings.push(
      `These photos have a section that doesn't exist in the form and were not applied: ${rejectedPhotos
        .map((m) => `${m.ref} (${m.rawSection})`)
        .join(", ")}.`,
    );
  }
  const badSections = matches
    .filter((m) => m.section && !sectionOptions.includes(m.section))
    .map((m) => m.ref);
  if (badSections.length) {
    warnings.push(
      `Unknown photo sections, these photos will be unsectioned: ${badSections.join(", ")}.`,
    );
  }
  return warnings;
}

function buildPatch(
  listing: ImportedListing,
  matches: Match[],
  documentTypes: PropertyDocumentType[],
  sectionOptions: string[],
): ListingFormPatch {
  const coords = listing.location?.coordinates;
  return {
    basic: {
      title: listing.title,
      listingPurpose: listing.listingPurpose,
      category: listing.category,
      type: listing.type,
      price: listing.price,
      currency: listing.currency,
      negotiable: listing.negotiable,
      description: listing.description,
    },
    details: {
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      area: listing.area,
      features: resolveFeatures(listing.features ?? []).matched,
    },
    location: {
      address: listing.location?.address,
      city: listing.location?.city,
      state: listing.location?.state,
      country: listing.location?.country,
      lat: coords?.lat,
      lng: coords?.lng,
      pinVisibility: coords?.pin_visibility,
    },
    documents: (listing.documents ?? []).filter((d) =>
      documentTypes.includes(d),
    ),
    photos: matches.flatMap((m) =>
      m.file && m.sectionValid ? [{ file: m.file, section: m.section }] : [],
    ),
  };
}

export default function ListingJsonImport({
  documentTypes,
  sectionOptions,
  onApply,
  onClose,
  hasExistingInput,
}: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{
    listing: ImportedListing | null;
    errors: string[];
  }>({
    listing: null,
    errors: [],
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(false);

  const { confirm } = useConfirm();

  const matches = useMemo<Match[]>(() => {
    const byName = new Map(photos.map((f) => [f.name.toLowerCase(), f]));
    return (parsed.listing?.photos ?? []).map((p) => {
      const { section, valid } = resolveSection(p.section);
      return {
        ref: p.ref,
        rawSection: p.section,
        section: section as MediaSection,
        sectionValid: valid,
        file: byName.get(p.ref.toLowerCase()),
      };
    });
  }, [parsed.listing, photos]);

  const warnings = useMemo(
    () =>
      parsed.listing
        ? getWarnings(parsed.listing, matches, documentTypes, sectionOptions)
        : [],
    [parsed.listing, matches, documentTypes, sectionOptions],
  );

  const applyNow = () => {
    if (!listing) return;
    onApply(buildPatch(listing, matches, documentTypes, sectionOptions));
  };

  const handleFillClick = async () => {
    if (!listing || isApplying) return;

    if (!hasExistingInput) {
      applyNow();
      return;
    }

    setIsApplying(true);
    try {
      const confirmed = await confirm({
        title: "Replace what's already in the form?",
        message:
          "This file will overwrite the title, description, price, location, documents and photos currently in the form. Fields the file doesn't include will be cleared.",
        cancelLabel: "Cancel",
        confirmLabel: "Replace with import",
      });
      if (confirmed) applyNow();
    } finally {
      setIsApplying(false);
    }
  };

  async function handleJsonChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setFileName(file.name);
    setReadError(null);
    try {
      const text = await file.text();
      setParsed(validate(JSON.parse(text)));
    } catch {
      setParsed({ listing: null, errors: [] });
      setReadError("This file isn't valid JSON.");
    }
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotos(Array.from(e.target.files ?? []));
  }

  const { listing, errors } = parsed;
  const attached = matches.filter((m) => m.file).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FaFileImport />
          </span>
          <div>
            <h3 className="font-semibold leading-tight">
              Import listing from JSON
            </h3>
            <p className="mt-0.5 text-xs text-foreground/60">
              Upload a listing file, review the details, then attach its photos.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-foreground/60 transition hover:bg-background hover:text-foreground"
          >
            Close
          </button>
        )}
      </div>

      <div className="space-y-5 p-5">
        <label
          className={`group flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-7 text-center text-sm transition ${
            fileName
              ? "border-green-500/40 bg-green-500/5"
              : "border-border hover:border-primary/50 hover:bg-background"
          }`}
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              fileName
                ? "bg-green-500/15 text-green-600"
                : "bg-primary/10 text-primary"
            }`}
          >
            {fileName ? <LuCircleCheck /> : <FaFileImport />}
          </span>
          <span className="max-w-full truncate font-medium">
            {fileName ?? "Choose a .json file"}
          </span>
          <span className="text-xs text-foreground/60">
            {fileName ? "Click to replace" : "JSON only"}
          </span>
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleJsonChange}
          />
        </label>

        {readError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-sm text-red-600">
            <LuTriangleAlert className="mt-0.5 shrink-0" />
            <span>{readError}</span>
          </div>
        )}

        {errors.length > 0 && (
          <ul className="space-y-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-sm text-red-600">
            {errors.map((err, index) => (
              <li key={err + index} className="flex items-start gap-2">
                <LuTriangleAlert className="mt-0.5 shrink-0" />
                <span>{err}</span>
              </li>
            ))}
          </ul>
        )}

        {listing && (
          <>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{listing.title}</p>
                  <p className="mt-1 text-sm text-foreground/70">
                    {[
                      listing.listingPurpose,
                      listing.type,
                      listing.bedrooms ? `${listing.bedrooms} bed` : undefined,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {(() => {
                    const { matched, unmatched } = resolveFeatures(
                      listing.features ?? [],
                    );
                    return (
                      <div className="mt-3 text-sm">
                        <p className="text-foreground/70">
                          Will apply {matched.length} feature
                          {matched.length === 1 ? "" : "s"}
                        </p>
                        {unmatched.length > 0 && (
                          <p className="text-amber-700">
                            {unmatched.length} feature
                            {unmatched.length === 1 ? "" : "s"} couldn't be
                            matched — see warnings below.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <span className="shrink-0 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700">
                  Parsed
                </span>
              </div>
            </div>
            {matches.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FaImages className="text-primary" />
                    Photos
                  </div>
                  <span className="text-xs text-foreground/60">
                    {attached}/{matches.length} attached
                  </span>
                </div>

                <div className="px-4 pt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${matches.length ? (attached / matches.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="px-4 py-3">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotos}
                    className="w-full text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
                  />
                </div>

                <ul className="max-h-56 divide-y divide-border/60 overflow-y-auto border-t border-border/60">
                  {matches.map((m) => (
                    <li
                      key={m.ref}
                      className="flex items-center gap-2 px-4 py-2 text-sm"
                    >
                      {m.file ? (
                        <LuCircleCheck className="shrink-0 text-green-600" />
                      ) : (
                        <LuTriangleAlert className="shrink-0 text-amber-500" />
                      )}
                      <span className="truncate">{m.ref}</span>
                      {m.section && (
                        <span className="ml-auto shrink-0 rounded bg-background px-2 py-0.5 text-xs text-foreground/60">
                          {m.section}
                        </span>
                      )}
                      {!m.sectionValid && (
                        <span className="text-destructive">
                          → unknown section "{m.rawSection}"
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700">
                <button
                  type="button"
                  onClick={() => setWarningsOpen((o) => !o)}
                  aria-expanded={warningsOpen}
                  aria-controls="import-warnings"
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left font-medium"
                >
                  <span className="flex items-center gap-2">
                    <LuTriangleAlert className="shrink-0" />
                    {warnings.length}{" "}
                    {warnings.length === 1 ? "warning" : "warnings"}
                  </span>
                  <LuChevronDown
                    className={`shrink-0 transition-transform ${warningsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {warningsOpen && (
                  <ul
                    id="import-warnings"
                    className="space-y-1.5 border-t border-amber-500/30 px-3 py-2.5"
                  >
                    {warnings.map((w) => (
                      <li key={w} className="flex items-start gap-2">
                        <LuTriangleAlert className="mt-0.5 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {listing && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-background/50 px-5 py-3">
          <p className="text-xs text-foreground/60">
            {matches.length > 0 && attached < matches.length
              ? `${matches.length - attached} photo(s) still missing`
              : "Ready to import"}
          </p>
          <Button
            onClick={handleFillClick}
            disabled={isApplying}
            loadingText="Filling..."
            isLoading={isApplying}
          >
            Fill listing form
          </Button>
        </div>
      )}
    </div>
  );
}
