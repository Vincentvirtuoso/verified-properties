import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Owner-side moderation calls (013_admin_moderation.sql):
 * ID documents, listing videos, appeals, suspension notice, support tickets.
 * Files go into the caller's own "<userId>/" folder (storage policies).
 */

export type IdDocType = "nin" | "passport" | "drivers_licence" | "voters_card";

export const ID_DOC_LABEL: Record<IdDocType, string> = {
  nin: "NIN slip / card",
  passport: "International passport",
  drivers_licence: "Driver's licence",
  voters_card: "Voter's card",
};

export type AppealSubject =
  | "listing"
  | "video"
  | "verification"
  | "identity_document"
  | "property_document"
  | "jv"
  | "suspension";

export interface MyIdentityDocument {
  id: string;
  docType: IdDocType;
  status: "pending" | "approved" | "rejected" | "more_info";
  reviewNote: string | null;
  createdAt: string;
}

export interface MyVideo {
  id: string;
  propertyId: string;
  fileName: string | null;
  status: "pending" | "approved" | "rejected" | "changes_requested";
  reviewNote: string | null;
  reviewedAt: string | null;
  youtubeVideoId: string | null;
  youtubePrivacy: string | null;
  storageDeletedAt: string | null;
}

export interface MyAppeal {
  id: string;
  subjectType: AppealSubject;
  subjectId: string;
  status: "open" | "accepted" | "declined";
  adminReply: string | null;
  createdAt: string;
}

export interface VerificationFeedback {
  subjectType: "agent" | "company";
  subjectId: string;
  decision: string | null;
  note: string | null;
  createdAt: string;
}

export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_ID_BYTES = 10 * 1024 * 1024;

const sb = (c?: SupabaseClient) => c ?? createClient();

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-").slice(-80);
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ---------- government ID ---------- */

export async function fetchMyIdentityDocuments(client?: SupabaseClient): Promise<MyIdentityDocument[]> {
  const { data, error } = await sb(client)
    .from("identity_documents")
    .select("id, doc_type, status, review_note, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    docType: r.doc_type,
    status: r.status,
    reviewNote: r.review_note,
    createdAt: r.created_at,
  }));
}

export async function uploadIdentityDocument(
  userId: string,
  docType: IdDocType,
  file: File,
  client?: SupabaseClient,
) {
  if (file.size > MAX_ID_BYTES) throw new Error("The file must be 10 MB or smaller.");
  if (!/^(image\/|application\/pdf)/.test(file.type)) throw new Error("Upload a photo or a PDF.");
  const supabase = sb(client);
  const path = `${userId}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const up = await supabase.storage.from("identity-documents").upload(path, file, { contentType: file.type });
  if (up.error) throw up.error;
  const { error } = await supabase.from("identity_documents").insert({ doc_type: docType, file_path: path });
  if (error) {
    await supabase.storage.from("identity-documents").remove([path]);
    throw error;
  }
}

export async function fetchMyVerificationFeedback(client?: SupabaseClient): Promise<VerificationFeedback[]> {
  const { data, error } = await sb(client).rpc("get_my_verification_feedback");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    subjectType: r.subject_type,
    subjectId: r.subject_id,
    decision: r.decision,
    note: r.note,
    createdAt: r.created_at,
  }));
}

/* ---------- listing videos ---------- */

export async function fetchMyVideos(client?: SupabaseClient): Promise<MyVideo[]> {
  const { data, error } = await sb(client)
    .from("listing_videos")
    .select("id, property_id, file_name, status, review_note, reviewed_at, youtube_video_id, youtube_privacy, storage_deleted_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    propertyId: r.property_id,
    fileName: r.file_name,
    status: r.status,
    reviewNote: r.review_note,
    reviewedAt: r.reviewed_at,
    youtubeVideoId: r.youtube_video_id,
    youtubePrivacy: r.youtube_privacy,
    storageDeletedAt: r.storage_deleted_at,
  }));
}

/** Uploads a video file for review. It reaches YouTube only after an admin approves it. */
export async function uploadListingVideo(
  userId: string,
  propertyId: string,
  file: File,
  client?: SupabaseClient,
) {
  if (!file.type.startsWith("video/")) throw new Error("Choose a video file.");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("The video must be 500 MB or smaller.");
  const supabase = sb(client);
  const path = `${userId}/${propertyId}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const up = await supabase.storage.from("listing-videos").upload(path, file, { contentType: file.type });
  if (up.error) throw up.error;
  const { error } = await supabase.from("listing_videos").insert({
    property_id: propertyId,
    storage_path: path,
    file_name: file.name.slice(0, 200),
    size_bytes: file.size,
  });
  if (error) {
    await supabase.storage.from("listing-videos").remove([path]);
    throw error;
  }
}

export async function deleteMyVideo(id: string, client?: SupabaseClient) {
  const supabase = sb(client);
  const { data } = await supabase.from("listing_videos").select("storage_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("listing_videos").delete().eq("id", id);
  if (error) throw error;
  if (data?.storage_path) await supabase.storage.from("listing-videos").remove([data.storage_path]);
}

/** Public: posted YouTube videos for live listings. */
export async function fetchPublicVideoIds(propertyIds: string[], client?: SupabaseClient) {
  if (!propertyIds.length) return new Map<string, string[]>();
  const { data, error } = await sb(client).rpc("get_public_listing_videos", { _property_ids: propertyIds });
  const map = new Map<string, string[]>();
  if (error) return map;
  for (const r of (data ?? []) as any[]) {
    map.set(r.property_id, [...(map.get(r.property_id) ?? []), `https://www.youtube.com/watch?v=${r.youtube_video_id}`]);
  }
  return map;
}

/* ---------- appeals ---------- */

export async function submitAppeal(subjectType: AppealSubject, subjectId: string, message: string, client?: SupabaseClient) {
  const { error } = await sb(client).rpc("submit_appeal", {
    _subject_type: subjectType,
    _subject_id: subjectId,
    _message: message.trim(),
  });
  if (error) throw error;
}

export async function fetchMyAppeals(client?: SupabaseClient): Promise<MyAppeal[]> {
  const { data, error } = await sb(client)
    .from("appeals")
    .select("id, subject_type, subject_id, status, admin_reply, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    subjectType: r.subject_type,
    subjectId: r.subject_id,
    status: r.status,
    adminReply: r.admin_reply,
    createdAt: r.created_at,
  }));
}

/* ---------- suspension ---------- */

export async function fetchMySuspension(client?: SupabaseClient): Promise<{ subjectType: string; subjectId: string; reason: string } | null> {
  const { data, error } = await sb(client)
    .from("account_suspensions")
    .select("subject_type, subject_id, reason")
    .limit(1);
  if (error || !data?.length) return null;
  const r: any = data[0];
  return { subjectType: r.subject_type, subjectId: r.subject_id, reason: r.reason };
}

/* ---------- support ---------- */

export async function createSupportTicket(
  input: { name: string; email: string; subject?: string; message: string },
  client?: SupabaseClient,
) {
  const supabase = sb(client);
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("support_tickets").insert({
    user_id: auth.user?.id ?? null,
    name: input.name.trim().slice(0, 120),
    email: input.email.trim().slice(0, 255),
    subject: input.subject?.trim().slice(0, 200) || null,
    message: input.message.trim().slice(0, 5000),
  });
  if (error) throw error;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
