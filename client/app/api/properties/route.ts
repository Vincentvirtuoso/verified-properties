import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadUserFile } from "@/lib/supabase/storage";
import { slugifyTitle } from "@/lib/supabase/properties";

/**
 * POST /api/properties — create a listing from the List Property form.
 *
 * Runs on the server with the caller's own session (cookie-based), so
 * every write is still subject to RLS and the guard_property_write()
 * trigger. No service-role key is used.
 */

const LISTING_PURPOSES = ["rent", "sale"];
const OWNER_TYPES = ["agent", "company"];
const MAX_IMAGES = 20;
const MAX_DOCUMENTS = 20;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseJsonArray(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string" && !!v.trim())
      : [];
  } catch {
    return [];
  }
}

function isFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "arrayBuffer" in v;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return bad("Authentication required", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Invalid form data");
  }

  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" ? v.trim() : "";
  };

  const title = str("title");
  const listingPurpose = str("listingPurpose");
  const category = str("category");
  const propertyType = str("type");
  const ownerType = str("ownerType");
  const address = str("address");
  const city = str("city");
  const state = str("state");
  const price = Number(str("price"));
  const bedrooms = Number(str("bedrooms"));
  const bathrooms = Number(str("bathrooms"));
  const area = str("area") ? Number(str("area")) : 0;

  if (!title) return bad("Title is required");
  if (!LISTING_PURPOSES.includes(listingPurpose)) return bad("Invalid purpose");
  if (!category) return bad("Category is required");
  if (!propertyType) return bad("Property type is required");
  if (!OWNER_TYPES.includes(ownerType)) return bad("Invalid owner type");
  if (!address || !city || !state) return bad("Address, city and state are required");
  if (!Number.isFinite(price) || price < 0) return bad("Invalid price");
  if (!Number.isInteger(bedrooms) || bedrooms < 0) return bad("Invalid bedrooms");
  if (!Number.isFinite(bathrooms) || bathrooms < 0) return bad("Invalid bathrooms");
  if (!Number.isFinite(area) || area < 0) return bad("Invalid area");

  const images = form.getAll("images").filter(isFile);
  if (images.length > MAX_IMAGES) return bad(`Up to ${MAX_IMAGES} images allowed`);

  const documentCount = Math.min(Number(str("documentCount")) || 0, MAX_DOCUMENTS);
  const documents: { file: File; type: string }[] = [];
  for (let i = 0; i < documentCount; i++) {
    const file = form.get(`document_${i}`);
    const type = str(`documentType_${i}`);
    if (isFile(file) && type) documents.push({ file, type });
  }

  for (const f of [...images, ...documents.map((d) => d.file)]) {
    if (f.size > MAX_FILE_BYTES) return bad(`"${f.name}" is larger than 10 MB`);
  }
  for (const img of images) {
    if (img.type && !img.type.startsWith("image/")) {
      return bad(`"${img.name}" is not an image`);
    }
  }

  const slug = slugifyTitle(title);

  // New listings are saved as drafts. Publishing is gated by verification
  // in the database (can_publish_listings).
  const { data: property, error: insertError } = await supabase
    .from("properties")
    .insert({
      slug,
      title,
      description: str("description") || null,
      category,
      property_type: propertyType,
      features: parseJsonArray(form.get("features")),
      owner_id: user.id,
      owner_type: ownerType,
      listing_purpose: listingPurpose,
      status: "draft",
      price,
      currency: str("currency") || "NGN",
      negotiable: str("negotiable") === "true",
      address,
      city,
      state,
      country: str("country") || "Nigeria",
      bedrooms,
      bathrooms,
      area,
      video_links: parseJsonArray(form.get("videoLinks")),
    })
    .select("id, slug")
    .single();

  if (insertError || !property) {
    return bad(insertError?.message ?? "Failed to create listing", 400);
  }

  try {
    const imageRows = [];
    for (let i = 0; i < images.length; i++) {
      const url = await uploadUserFile(
        "property-images",
        user.id,
        images[i],
        images[i].name,
        supabase,
      );
      imageRows.push({
        property_id: property.id,
        url,
        alt: title,
        sort_order: i,
      });
    }
    if (imageRows.length) {
      const { error } = await supabase.from("property_images").insert(imageRows);
      if (error) throw error;
    }

    const documentRows = [];
    for (const doc of documents) {
      const path = await uploadUserFile(
        "property-documents",
        user.id,
        doc.file,
        doc.file.name,
        supabase,
      );
      documentRows.push({
        property_id: property.id,
        document_type: doc.type,
        title: doc.file.name,
        file_url: path,
        uploaded_by: user.id,
      });
    }
    if (documentRows.length) {
      const { error } = await supabase
        .from("property_documents")
        .insert(documentRows);
      if (error) throw error;
    }
  } catch (err) {
    // Roll back the draft so a half-saved listing is not left behind.
    await supabase.from("properties").delete().eq("id", property.id);
    const message = err instanceof Error ? err.message : "Upload failed";
    return bad(`Could not upload files: ${message}`, 500);
  }

  return NextResponse.json(
    { _id: property.id, slug: property.slug, status: "draft" },
    { status: 201 },
  );
}
