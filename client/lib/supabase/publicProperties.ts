import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { mapPropertyRow } from "@/lib/supabase/properties";
import type { PopulatedProperty, PopulatedUser } from "@/types";

/**
 * Public (visitor-facing) property reads.
 * RLS only returns status = 'active' rows to visitors. Owner details and
 * document types come from the security-definer functions in
 * 007_public_listings.sql, which expose safe fields only.
 */

// Documents are excluded from the embed: property_documents is private.
const PUBLIC_PROPERTY_SELECT = "*, property_images(url, alt, sort_order)";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapPublicOwner(row: any): PopulatedUser {
  const company = row.company_id
    ? {
        _id: row.company_id,
        name: row.company_name,
        slug: row.company_slug,
        logo: row.company_logo ?? undefined,
        type: row.company_type,
        verificationStatus: row.company_verification_status,
        contactEmail: row.company_contact_email,
        contactPhone: row.company_contact_phone ?? undefined,
        whatsappNumber: row.company_whatsapp_number ?? undefined,
        team: [],
      }
    : undefined;

  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    whatsappNumber: row.whatsapp_number ?? undefined,
    avatar: row.avatar ?? undefined,
    activeRole: row.active_role,
    roles: [row.active_role],
    isEmailVerified: true,
    isPhoneVerified: false,
    agentProfile: row.agent_sub_role
      ? {
          subRole: row.agent_sub_role,
          logo: row.agent_logo ?? undefined,
          verificationStatus: row.agent_verification_status,
          activeListings: 0,
          activeBoostedListings: 0,
        }
      : undefined,
    companyId: company,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.created_at),
  } as unknown as PopulatedUser;
}

const unknownOwner = (id: string): PopulatedUser =>
  ({
    _id: id,
    name: "Verified Properties member",
    email: "",
    roles: [],
    activeRole: "agent",
    isEmailVerified: false,
    isPhoneVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as unknown as PopulatedUser;

async function hydrate(
  supabase: SupabaseClient,
  rows: any[],
): Promise<PopulatedProperty[]> {
  if (rows.length === 0) return [];

  const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
  const propertyIds = rows.map((r) => r.id);

  const [owners, docs] = await Promise.all([
    supabase.rpc("get_public_listing_owners", { _owner_ids: ownerIds }),
    supabase.rpc("get_public_listing_document_types", {
      _property_ids: propertyIds,
    }),
  ]);
  if (owners.error) throw owners.error;
  if (docs.error) throw docs.error;

  const ownerMap = new Map<string, PopulatedUser>(
    (owners.data ?? []).map((o: any) => [o.id, mapPublicOwner(o)]),
  );
  const docMap = new Map<string, any[]>();
  for (const d of docs.data ?? []) {
    const list = docMap.get(d.property_id) ?? [];
    list.push({ ...d, file_url: "" });
    docMap.set(d.property_id, list);
  }

  return rows.map((row) =>
    mapPropertyRow(
      { ...row, property_documents: docMap.get(row.id) ?? [] },
      ownerMap.get(row.owner_id) ?? unknownOwner(row.owner_id),
    ),
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** All active listings, newest first. */
export async function fetchActiveProperties(
  options: { tier?: "featured" | "standard"; limit?: number } = {},
  client?: SupabaseClient,
): Promise<PopulatedProperty[]> {
  const supabase = client ?? createClient();
  let query = supabase
    .from("properties")
    .select(PUBLIC_PROPERTY_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (options.tier) query = query.eq("tier", options.tier);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return hydrate(supabase, data ?? []);
}

/** Active listings with the given IDs (order not guaranteed). */
export async function fetchActivePropertiesByIds(
  ids: string[],
  client?: SupabaseClient,
): Promise<PopulatedProperty[]> {
  if (ids.length === 0) return [];
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(PUBLIC_PROPERTY_SELECT)
    .eq("status", "active")
    .in("id", ids);
  if (error) throw error;
  return hydrate(supabase, data ?? []);
}

/** One active listing by slug, or null. */
export async function fetchPropertyBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<PopulatedProperty | null> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(PUBLIC_PROPERTY_SELECT)
    .eq("status", "active")
    .ilike("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const [property] = await hydrate(supabase, [data]);
  return property;
}

/** Home page counters, computed from active listings. */
export async function fetchPublicStats(client?: SupabaseClient) {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("city, owner_id")
    .eq("status", "active");

  if (error) throw error;
  const rows = data ?? [];
  return {
    totalProperties: rows.length,
    cities: new Set(rows.map((r) => r.city)).size,
    owners: new Set(rows.map((r) => r.owner_id)).size,
  };
}
