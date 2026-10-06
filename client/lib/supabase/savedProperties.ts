import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { fetchActivePropertiesByIds } from "@/lib/supabase/publicProperties";
import type { SavedProperty } from "@/types";

/** IDs of every listing the signed-in user has saved (RLS: own rows only). */
export async function fetchSavedPropertyIds(
  client?: SupabaseClient,
): Promise<string[]> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("saved_properties")
    .select("property_id");
  if (error) throw error;
  return (data ?? []).map((r) => r.property_id as string);
}

/** Saved listings with full property details, most recently saved first.
 *  Listings that are no longer active are left out. */
export async function fetchSavedProperties(
  client?: SupabaseClient,
): Promise<SavedProperty[]> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("saved_properties")
    .select("property_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const properties = await fetchActivePropertiesByIds(
    rows.map((r) => r.property_id as string),
    supabase,
  );
  const byId = new Map(properties.map((p) => [p._id, p]));

  return rows.flatMap((r) => {
    const property = byId.get(r.property_id as string);
    return property ? [{ ...property, savedAt: r.created_at as string }] : [];
  });
}

export async function saveProperty(propertyId: string, client?: SupabaseClient) {
  const supabase = client ?? createClient();
  const { error } = await supabase
    .from("saved_properties")
    .upsert(
      { property_id: propertyId },
      { onConflict: "user_id,property_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function unsaveProperty(propertyId: string, client?: SupabaseClient) {
  const supabase = client ?? createClient();
  const { error } = await supabase
    .from("saved_properties")
    .delete()
    .eq("property_id", propertyId);
  if (error) throw error;
}
