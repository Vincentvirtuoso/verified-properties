import { NextResponse } from "next/server";
import { createClient } from "@affilhomes/shared/supabase/client";
import { uploadUserFile, slugifyTitle } from "@affilhomes/shared/supabase";
import { isInNigeria } from "@affilhomes/shared/utils/geo";
import {
  MEDIA_SECTIONS,
  Role,
  type MediaSection,
  type PropertyCategory,
  type PropertyDocumentType,
  type PropertyFeature,
  type PropertyType,
} from "@affilhomes/shared/types";
import {
  DOCUMENT_TYPES,
  isAuthServiceError,
  PROPERTY_FEATURES,
  PROPERTY_TYPES_BY_CATEGORY,
} from "@/utils";
import { MAX_IMAGES } from "@/app/(authenticated)/list-property/components/constants";
import { createClientFromServer } from "@affilhomes/shared/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/properties: create a draft listing from the List Property form.
 *
 * Runs with the caller's session, so RLS and guard_property_write() still apply.
 * The owner type is taken from the account, not the form.
 */

const LISTING_PURPOSES = new Set(["rent", "sale"]);
const VISIBILITY_VALUES = new Set(["public", "private"]);
const MEDIA_SECTION_VALUES = new Set<string>(
  MEDIA_SECTIONS.map((s) => s.value),
);
const DOCUMENT_TYPE_VALUES = new Set<string>(
  DOCUMENT_TYPES.map((docType) => docType.value),
);
const FEATURE_VALUES = new Set<string>(
  PROPERTY_FEATURES.map((feature) => feature.value),
);
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_DOCUMENTS = 20;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

type UploadedObject = { bucket: string; path: string };

type ListingInput = {
  title: string;
  description: string | null;
  listingPurpose: "rent" | "sale";
  category: PropertyCategory;
  propertyType: PropertyType;
  features: PropertyFeature[];
  price: number;
  currency: string;
  negotiable: boolean;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  locationVisibility: "public" | "private";
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: { file: File; section: MediaSection }[];
  documents: { file: File; type: PropertyDocumentType }[];
  declaredDocuments: PropertyDocumentType[];
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "arrayBuffer" in v;
}

function parseJsonArray(value: FormDataEntryValue | null): unknown[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Validates the form. Returns the cleaned input, or the first error found. */
function parseListing(
  form: FormData,
): { error: string } | { value: ListingInput } {
  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" ? v.trim() : "";
  };
  // Empty input must be NaN, not 0. Number("") is 0, which would let a blank price through.
  const num = (key: string) => {
    const s = str(key);
    return s === "" ? NaN : Number(s);
  };
  const fail = (error: string) => ({ error });

  const title = str("title");
  if (!title) return fail("Title is required");

  const listingPurpose = str("listingPurpose");
  if (!LISTING_PURPOSES.has(listingPurpose))
    return fail("Choose For Sale or For Rent");

  const category = str("category");
  if (!Object.hasOwn(PROPERTY_TYPES_BY_CATEGORY, category))
    return fail("Invalid category");
  const typedCategory = category as PropertyCategory;

  const propertyType = str("type") as PropertyType;
  if (!PROPERTY_TYPES_BY_CATEGORY[typedCategory].includes(propertyType)) {
    return fail("Property type does not match the category");
  }

  const price = num("price");
  if (!Number.isFinite(price) || price <= 0) return fail("Enter a valid price");

  const currency = str("currency") || "NGN";
  if (currency !== "NGN") return fail("Unsupported currency");

  const bedrooms = num("bedrooms");
  if (!Number.isInteger(bedrooms) || bedrooms < 0)
    return fail("Enter number of bedrooms");

  const bathrooms = num("bathrooms");
  if (!Number.isInteger(bathrooms) || bathrooms < 0)
    return fail("Enter number of bathrooms");

  const area = str("area") ? num("area") : 0;
  if (!Number.isFinite(area) || area < 0) return fail("Invalid area");

  const address = str("address");
  const city = str("city");
  const state = str("state");
  const country = str("country") || "Nigeria";
  if (!address || !city || !state)
    return fail("Address, city and state are required");

  const latitude = num("latitude");
  const longitude = num("longitude");
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return fail("Pin the exact location on the map");
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return fail("The pin location is invalid");
  }
  if (
    country.toLowerCase() === "nigeria" &&
    !isInNigeria(latitude, longitude)
  ) {
    return fail("The pin must be inside Nigeria");
  }

  const locationVisibility = str("locationVisibility");
  if (!VISIBILITY_VALUES.has(locationVisibility))
    return fail("Choose a location visibility");

  const features = parseJsonArray(form.get("features")).filter(
    (f): f is PropertyFeature => typeof f === "string" && FEATURE_VALUES.has(f),
  );

  const rawImages = form.getAll("images");
  if (rawImages.length > MAX_IMAGES)
    return fail(`Up to ${MAX_IMAGES} photos allowed`);

  const images: ListingInput["images"] = [];
  for (let i = 0; i < rawImages.length; i++) {
    const file = rawImages[i];
    if (!isFile(file)) continue;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type))
      return fail(`"${file.name}" is not a JPEG, PNG or WebP image`);
    if (file.size > MAX_FILE_BYTES)
      return fail(`"${file.name}" is larger than 10 MB`);

    const section = str(`imageSection_${i}`);
    images.push({
      file,
      section: (MEDIA_SECTION_VALUES.has(section)
        ? section
        : "general") as MediaSection,
    });
  }

  const documentCount = Math.min(num("documentCount") || 0, MAX_DOCUMENTS);
  const documents: ListingInput["documents"] = [];
  for (let i = 0; i < documentCount; i++) {
    const file = form.get(`document_${i}`);
    const type = str(`documentType_${i}`);
    if (!isFile(file) || !DOCUMENT_TYPE_VALUES.has(type)) continue;
    if (file.size > MAX_FILE_BYTES)
      return fail(`"${file.name}" is larger than 10 MB`);
    documents.push({ file, type: type as PropertyDocumentType });
  }

  const declaredDocuments = parseJsonArray(form.get("documentTypes")).filter(
    (t): t is PropertyDocumentType =>
      typeof t === "string" && DOCUMENT_TYPE_VALUES.has(t),
  );

  return {
    value: {
      title,
      description: str("description") || null,
      listingPurpose: listingPurpose as "rent" | "sale",
      category: typedCategory,
      propertyType,
      features,
      price,
      currency,
      negotiable: str("negotiable") === "true",
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      locationVisibility: locationVisibility as "public" | "private",
      bedrooms,
      bathrooms,
      area,
      images,
      documents,
      declaredDocuments: [...new Set(declaredDocuments)],
    },
  };
}

/**
 * Returns the owner type for the signed-in account, or null if the account
 * cannot list properties. Replace the body with your real role lookup.
 */
async function getOwnerType(
  supabase: SupabaseClient,
  userId: string,
): Promise<"agent" | "company" | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Owner type lookup failed:", error);
    throw error;
  }

  if (data?.active_role === Role.Agent) return "agent";
  if (data?.active_role === Role.Company) return "company";
  return null;
}

async function removeUploaded(
  supabase: SupabaseClient,
  uploaded: UploadedObject[],
) {
  const byBucket = new Map<string, string[]>();
  for (const { bucket, path } of uploaded) {
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), path]);
  }
  await Promise.all(
    [...byBucket].map(([bucket, paths]) =>
      supabase.storage.from(bucket).remove(paths),
    ),
  );
}

export async function POST(request: Request) {
  const supabase = await createClientFromServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && isAuthServiceError(authError)) {
    console.error("Session check failed (Supabase unreachable):", authError);
    return bad(
      "We couldn't verify your sign-in right now. Please try again in a moment.",
      503,
    );
  }

  if (!user) {
    return bad("Your session has expired. Please sign in again.", 401);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Invalid form data");
  }

  const parsed = parseListing(form);
  if ("error" in parsed) return bad(parsed.error);
  const input = parsed.value;

    let ownerType: "agent" | "company" | null;
    try {
      ownerType = await getOwnerType(supabase, user.id);
    } catch {
      return bad("Could not verify your account. Please try again.", 500);
    }
    if (!ownerType)
      return bad("Only agents and companies can list properties", 403);

  const slug = `${slugifyTitle(input.title)}-${crypto.randomUUID().slice(0, 8)}`;
  const hasDeclaredDocs = input.declaredDocuments.length > 0;

  const { data: property, error: insertError } = await supabase
    .from("properties")
    .insert({
      slug,
      title: input.title,
      description: input.description,
      category: input.category,
      property_type: input.propertyType,
      features: input.features,
      owner_id: user.id,
      owner_type: ownerType,
      listing_purpose: input.listingPurpose,
      status: "draft",
      price: input.price,
      currency: input.currency,
      negotiable: input.negotiable,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country,
      latitude: input.latitude,
      longitude: input.longitude,
      location_visibility: input.locationVisibility,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area: input.area,
      declared_document_types: input.declaredDocuments,
      document_status: hasDeclaredDocs ? "declared" : "none",
      video_links: [],
    })
    .select("id, slug")
    .single();

  if (insertError || !property) {
    console.error("Create listing failed:", insertError);
    return bad("Could not save the listing. Please try again.", 500);
  }

  const uploaded: UploadedObject[] = [];

  try {
    if (input.images.length > 0) {
      const imageRows = [];
      for (const [i, { file, section }] of input.images.entries()) {
        const path = await uploadUserFile(
          "property-images",
          user.id,
          file,
          file.name,
          supabase,
        );
        uploaded.push({ bucket: "property-images", path });
        imageRows.push({
          property_id: property.id,
          url: path,
          alt: input.title,
          sort_order: i,
          section,
        });
      }
      const { error } = await supabase
        .from("property_images")
        .insert(imageRows);
      if (error) throw error;
    }

    if (input.documents.length > 0) {
      const documentRows = [];
      for (const { file, type } of input.documents) {
        const path = await uploadUserFile(
          "property-documents",
          user.id,
          file,
          file.name,
          supabase,
        );
        uploaded.push({ bucket: "property-documents", path });
        documentRows.push({
          property_id: property.id,
          document_type: type,
          title: file.name,
          file_url: path,
          uploaded_by: user.id,
        });
      }
      const { error } = await supabase
        .from("property_documents")
        .insert(documentRows);
      if (error) throw error;
    }
  } catch (err) {
    console.error("Listing upload failed:", err);
    await removeUploaded(supabase, uploaded);
    await supabase.from("properties").delete().eq("id", property.id);
    return bad("Could not upload your files. Please try again.", 500);
  }

  return NextResponse.json(
    { _id: property.id, slug: property.slug, status: "draft" },
    { status: 201 },
  );
}
