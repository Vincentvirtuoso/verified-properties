import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Admin + publishing calls (010_admin_and_publishing.sql).
 * Every admin function re-checks the admin role in the database, so
 * hiding the admin page in the browser is only a convenience.
 */

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type ListingStatus = "draft" | "active" | "sold" | "rented" | "inactive";

export interface VerificationItem {
  subjectType: "agent" | "company";
  subjectId: string;
  name: string;
  email: string | null;
  phone: string | null;
  detail: string | null;
  logo: string | null;
  documents: Record<string, unknown>;
  status: VerificationStatus;
  createdAt: string;
}

export interface AdminListing {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
  city: string;
  state: string;
  price: number;
  ownerName: string;
  createdAt: string;
}

const sb = (c?: SupabaseClient) => c ?? createClient();

export async function isAdmin(client?: SupabaseClient): Promise<boolean> {
  const { data, error } = await sb(client).rpc("is_admin");
  if (error) return false;
  return data === true;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchVerificationQueue(
  status: VerificationStatus = "pending",
  client?: SupabaseClient,
): Promise<VerificationItem[]> {
  const { data, error } = await sb(client).rpc("admin_verification_queue", { _status: status });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    subjectType: r.subject_type,
    subjectId: r.subject_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    detail: r.detail,
    logo: r.logo,
    documents: r.documents ?? {},
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function setVerification(
  item: Pick<VerificationItem, "subjectType" | "subjectId">,
  status: "verified" | "rejected",
  note?: string,
  client?: SupabaseClient,
) {
  const { error } = await sb(client).rpc("admin_set_verification", {
    _subject_type: item.subjectType,
    _subject_id: item.subjectId,
    _status: status,
    _note: note?.trim().slice(0, 500) || null,
  });
  if (error) throw error;
}

export async function fetchAdminListings(
  status: ListingStatus | null = null,
  client?: SupabaseClient,
): Promise<AdminListing[]> {
  const { data, error } = await sb(client).rpc("admin_list_properties", { _status: status });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    status: r.status,
    city: r.city,
    state: r.state,
    price: Number(r.price),
    ownerName: r.owner_name,
    createdAt: r.created_at,
  }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function adminUnpublish(propertyId: string, client?: SupabaseClient) {
  const { error } = await sb(client).rpc("admin_unpublish_property", { _property_id: propertyId });
  if (error) throw error;
}

/** Signed link (10 min) to a private verification file, e.g. a CAC certificate. */
export async function documentLink(path: string, client?: SupabaseClient): Promise<string> {
  if (/^https?:\/\//.test(path)) return path;
  const { data, error } = await sb(client)
    .storage.from("company-documents")
    .createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
}

/* ---------- owner side ---------- */

export async function canPublishListings(userId: string, client?: SupabaseClient) {
  const { data, error } = await sb(client).rpc("can_publish_listings", { p_user_id: userId });
  if (error) return false;
  return data === true;
}

export async function requestAgentVerification(client?: SupabaseClient): Promise<VerificationStatus> {
  const { data, error } = await sb(client).rpc("request_agent_verification");
  if (error) throw error;
  return data as VerificationStatus;
}

/** Publish (active) or take down (inactive) one of your own listings. */
export async function setListingStatus(
  propertyId: string,
  status: Extract<ListingStatus, "active" | "inactive">,
  client?: SupabaseClient,
) {
  const { error } = await sb(client).from("properties").update({ status }).eq("id", propertyId);
  if (error) throw error;
}
