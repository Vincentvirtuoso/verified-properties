import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { PopulatedProperty, PopulatedUser } from "@/types";

export const PROPERTY_SELECT =
  "*, property_images(url, alt, sort_order), property_documents(id, document_type, title, file_url, uploaded_at)";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapPropertyRow(
  row: any,
  owner: PopulatedUser,
): PopulatedProperty {
  const gallery = [...(row.property_images ?? [])]
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((img: any) => ({ url: img.url, alt: img.alt ?? undefined }));

  return {
    _id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category,
    type: row.property_type,
    features: row.features ?? [],
    ownerId: owner,
    ownerType: row.owner_type,
    tier: row.tier,
    activeBoostId: row.active_boost_id ?? undefined,
    listingPurpose: row.listing_purpose,
    status: row.status,
    price: Number(row.price),
    currency: row.currency,
    negotiable: row.negotiable,
    discount: row.discount ?? undefined,
    location: {
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      coordinates:
        row.latitude != null && row.longitude != null
          ? { lat: row.latitude, lng: row.longitude }
          : undefined,
    },
    bedrooms: row.bedrooms,
    bathrooms: Number(row.bathrooms),
    area: Number(row.area),
    image: gallery[0]?.url,
    gallery,
    videoLinks: row.video_links ?? [],
    documents: (row.property_documents ?? []).map((d: any) => ({
      id: d.id,
      type: d.document_type,
      title: d.title ?? undefined,
      fileUrl: d.file_url,
      uploadedAt: d.uploaded_at,
    })),
    totalInquiries: row.total_inquiries,
    totalClosedDeals: row.total_closed_deals,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** All listings owned by the given user (drafts included; RLS: owner only). */
export async function fetchMyListings(
  owner: PopulatedUser,
  client?: SupabaseClient,
): Promise<PopulatedProperty[]> {
  const supabase = client ?? createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .eq("owner_id", owner._id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapPropertyRow(row, owner));
}

export function slugifyTitle(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "property"}-${Math.random().toString(36).slice(2, 8)}`;
}
