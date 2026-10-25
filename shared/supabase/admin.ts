import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";
export type ListingStatus = "draft" | "active" | "sold" | "rented" | "inactive";
export type ReviewStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested";
export type Decision = "approve" | "reject" | "more_info";

export const DECISION_LABEL: Record<Decision, string> = {
  approve: "Approve",
  reject: "Reject",
  more_info: "Request more info",
};

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

export interface IdentityDocumentItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  docType: string;
  filePath: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
}

export interface ListingImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
}


export interface AdminListing {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
  reviewStatus: ReviewStatus;
  reviewNote: string | null;
  submittedAt: string | null;
  city: string;
  state: string;
  coverImage: { url: string; alt: string } | null;
  imageCount: number;
  price: number;
  ownerId: string;
  ownerName: string;
  ownerVerified: boolean;
  ownerSuspended: boolean;
  documentsTotal: number;
  documentsApproved: number;
  createdAt: string;
}

export interface ListingDocument {
  id: string;
  documentType: string;
  title: string | null;
  fileUrl: string;
  reviewStatus: string;
  reviewNote: string | null;
}

export interface AdminVideo {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertySlug: string;
  propertyStatus: ListingStatus;
  ownerName: string;
  ownerVerified: boolean;
  storagePath: string;
  fileName: string | null;
  sizeBytes: number | null;
  status: string;
  reviewNote: string | null;
  youtubeVideoId: string | null;
  youtubePrivacy: string | null;
  youtubeDesiredPrivacy: string | null;
  youtubeError: string | null;
  storageDeletedAt: string | null;
  createdAt: string;
}

export interface AdminAccount {
  subjectType: "user" | "company";
  id: string;
  name: string;
  email: string | null;
  detail: string | null;
  verificationStatus: string;
  suspended: boolean;
  suspensionReason: string | null;
  createdAt: string;
}

export interface AdminAppeal {
  id: string;
  userName: string;
  userEmail: string | null;
  subjectType: string;
  subjectId: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
}

export interface AdminTicket {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export interface AdminJV {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
  reviewStatus: ReviewStatus;
  reviewNote: string | null;
  city: string;
  state: string;
  landValue: number | null;
  roi: number | null;
  ownerName: string;
  ownerVerified: boolean;
  createdAt: string;
}

export type AdminRequestStatus = "pending" | "approved" | "rejected";

export interface AdminRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  message: string | null;
  status: AdminRequestStatus;
  createdAt: string;
}

export interface AuditEntry {
  id: number;
  adminId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

const sb = (c?: SupabaseClient) => c ?? createClient();

/** Turns a database error into a short message an admin can act on. */
export function errorText(
  err: unknown,
  fallback = "Something went wrong.",
): string {
  const m = (err as { message?: string })?.message;
  return m && m.length < 200 ? m : fallback;
}

export async function isAdmin(client?: SupabaseClient): Promise<boolean> {
  const { data, error } = await sb(client).rpc("is_admin");
  if (error) return false;
  return data === true;
}

/** Called by a signed-in user from the public app. Returns the request id. */
export async function requestAdminAccess(
  message?: string | null,
  client?: SupabaseClient,
): Promise<string> {
  const trimmed = message?.trim() || null;
  return rpc<string>("request_admin_access", { _message: trimmed }, client);
}

/** Super admin only. Pass null to list every status. */
export async function fetchAdminRequests(
  status: AdminRequestStatus | null = "pending",
  client?: SupabaseClient,
): Promise<AdminRequest[]> {
  const data = await rpc<any[]>(
    "super_admin_list_admin_requests",
    { _status: status },
    client,
  );
  return (data ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    message: r.message,
    status: r.status,
    createdAt: r.created_at,
  }));
}

/** Super admin only. Approving grants the admin role and activates the account. */
export async function superAdminReviewAdminRequest(
  id: string,
  approve: boolean,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "super_admin_review_admin_request",
    { _id: id, _approve: approve, _reason: reason.trim() },
    client,
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function rpc<T = any>(
  name: string,
  args: Record<string, unknown> = {},
  client?: SupabaseClient,
) {
  const { data, error } = await sb(client).rpc(name, args);
  if (error) throw error;
  return data as T;
}

/* ---------- verification ---------- */

export async function fetchVerificationQueue(
  status: VerificationStatus = "pending",
  client?: SupabaseClient,
): Promise<VerificationItem[]> {
  const data = await rpc<any[]>(
    "admin_verification_queue",
    { _status: status },
    client,
  );
  return (data ?? []).map((r) => ({
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
  decision: Decision,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_set_verification",
    {
      _subject_type: item.subjectType,
      _subject_id: item.subjectId,
      _decision: decision,
      _reason: reason.trim(),
    },
    client,
  );
}

export async function fetchIdentityDocuments(
  status: string | null = "pending",
  client?: SupabaseClient,
): Promise<IdentityDocumentItem[]> {
  const data = await rpc<any[]>(
    "admin_list_identity_documents",
    { _status: status },
    client,
  );
  return (data ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    docType: r.doc_type,
    filePath: r.file_path,
    status: r.status,
    reviewNote: r.review_note,
    createdAt: r.created_at,
  }));
}

export async function reviewIdentityDocument(
  id: string,
  decision: Decision,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_review_identity_document",
    { _id: id, _decision: decision, _reason: reason.trim() },
    client,
  );
}

/* ---------- listings ---------- */

export async function fetchAdminListings(
  status: ListingStatus | null = null,
  reviewStatus: ReviewStatus | null = null,
  client?: SupabaseClient,
): Promise<AdminListing[]> {
  const data = await rpc<any[]>(
    "admin_list_properties",
    { _status: status, _review_status: reviewStatus },
    client,
  );
  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    status: r.status,
    reviewStatus: r.review_status,
    reviewNote: r.review_note,
    submittedAt: r.submitted_at,
    city: r.city,
    state: r.state,
    price: Number(r.price),
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    coverImage: r.cover_image_url
      ? { url: r.cover_image_url, alt: r.cover_image_alt ?? "" }
      : null,
    imageCount: r.image_count,
    ownerVerified: !!r.owner_verified,
    ownerSuspended: !!r.owner_suspended,
    documentsTotal: r.documents_total ?? 0,
    documentsApproved: r.documents_approved ?? 0,
    createdAt: r.created_at,
  }));
}

export async function fetchListingDocuments(
  propertyId: string,
  client?: SupabaseClient,
): Promise<ListingDocument[]> {
  const data = await rpc<any[]>(
    "admin_listing_documents",
    { _property_id: propertyId },
    client,
  );
  return (data ?? []).map((r) => ({
    id: r.id,
    documentType: r.document_type,
    title: r.title,
    fileUrl: r.file_url,
    reviewStatus: r.review_status,
    reviewNote: r.review_note,
  }));
}

export async function reviewPropertyDocument(
  id: string,
  decision: Decision,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_review_property_document",
    { _id: id, _decision: decision, _reason: reason.trim() },
    client,
  );
}

export async function reviewListing(
  propertyId: string,
  decision: Decision,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_review_listing",
    { _property_id: propertyId, _decision: decision, _reason: reason.trim() },
    client,
  );
}

export async function adminUnpublish(
  propertyId: string,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_unpublish_property",
    { _property_id: propertyId, _reason: reason.trim() },
    client,
  );
}

/* ---------- videos ---------- */

export async function fetchAdminVideos(
  status: string | null = "pending",
  client?: SupabaseClient,
): Promise<AdminVideo[]> {
  const data = await rpc<any[]>(
    "admin_list_videos",
    { _status: status },
    client,
  );
  return (data ?? []).map((r) => ({
    id: r.id,
    propertyId: r.property_id,
    propertyTitle: r.property_title,
    propertySlug: r.property_slug,
    propertyStatus: r.property_status,
    ownerName: r.owner_name,
    ownerVerified: !!r.owner_verified,
    storagePath: r.storage_path,
    fileName: r.file_name,
    sizeBytes: r.size_bytes,
    status: r.status,
    reviewNote: r.review_note,
    youtubeVideoId: r.youtube_video_id,
    youtubePrivacy: r.youtube_privacy,
    youtubeDesiredPrivacy: r.youtube_desired_privacy,
    youtubeError: r.youtube_error,
    storageDeletedAt: r.storage_deleted_at,
    createdAt: r.created_at,
  }));
}

export async function reviewVideo(
  id: string,
  decision: Decision,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_review_video",
    { _id: id, _decision: decision, _reason: reason.trim() },
    client,
  );
}

/** Asks the server to post an approved video to the Affilhomes YouTube channel. */
export async function postVideoToYouTube(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`/api/admin/videos/${id}/publish`, {
    method: "POST",
    credentials: "include",
  });
  const body = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    message:
      body?.message ??
      body?.error ??
      (res.ok ? "Posted" : "Couldn't post the video"),
  };
}

/* ---------- accounts ---------- */

export async function searchAccounts(
  query: string,
  onlySuspended = false,
  client?: SupabaseClient,
): Promise<AdminAccount[]> {
  const data = await rpc<any[]>(
    "admin_search_accounts",
    { _query: query, _only_suspended: onlySuspended },
    client,
  );
  return (data ?? []).map((r) => ({
    subjectType: r.subject_type,
    id: r.id,
    name: r.name,
    email: r.email,
    detail: r.detail,
    verificationStatus: r.verification_status,
    suspended: !!r.suspended,
    suspensionReason: r.suspension_reason,
    createdAt: r.created_at,
  }));
}

export async function suspendAccount(
  subjectType: "user" | "company",
  id: string,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_suspend",
    { _subject_type: subjectType, _subject_id: id, _reason: reason.trim() },
    client,
  );
}

export async function unsuspendAccount(
  subjectType: "user" | "company",
  id: string,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_unsuspend",
    { _subject_type: subjectType, _subject_id: id, _reason: reason.trim() },
    client,
  );
}

/* ---------- appeals & support ---------- */

export async function fetchAppeals(
  status: string | null = "open",
  client?: SupabaseClient,
): Promise<AdminAppeal[]> {
  const data = await rpc<any[]>(
    "admin_list_appeals",
    { _status: status },
    client,
  );
  return (data ?? []).map((r) => ({
    id: r.id,
    userName: r.user_name,
    userEmail: r.user_email,
    subjectType: r.subject_type,
    subjectId: r.subject_id,
    message: r.message,
    status: r.status,
    adminReply: r.admin_reply,
    createdAt: r.created_at,
  }));
}

export async function resolveAppeal(
  id: string,
  accept: boolean,
  reply: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_resolve_appeal",
    { _id: id, _accept: accept, _reply: reply.trim() },
    client,
  );
}

export async function fetchTickets(
  status: string | null = "open",
  client?: SupabaseClient,
): Promise<AdminTicket[]> {
  const data = await rpc<any[]>(
    "admin_list_tickets",
    { _status: status },
    client,
  );
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject,
    message: r.message,
    status: r.status,
    adminNote: r.admin_note,
    createdAt: r.created_at,
  }));
}

export async function closeTicket(
  id: string,
  note: string,
  client?: SupabaseClient,
) {
  await rpc("admin_close_ticket", { _id: id, _note: note.trim() }, client);
}

/* ---------- JV ---------- */

export async function fetchAdminJV(
  reviewStatus: ReviewStatus | null = "pending",
  client?: SupabaseClient,
): Promise<AdminJV[]> {
  const data = await rpc<any[]>(
    "admin_list_jv",
    { _review_status: reviewStatus },
    client,
  );
  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    status: r.status,
    reviewStatus: r.review_status,
    reviewNote: r.review_note,
    city: r.city,
    state: r.state,
    landValue: r.land_value == null ? null : Number(r.land_value),
    roi: r.roi == null ? null : Number(r.roi),
    ownerName: r.owner_name,
    ownerVerified: !!r.owner_verified,
    createdAt: r.created_at,
  }));
}

export async function reviewJV(
  id: string,
  decision: Decision,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_review_jv",
    { _jv_id: id, _decision: decision, _reason: reason.trim() },
    client,
  );
}

export async function unpublishJV(
  id: string,
  reason: string,
  client?: SupabaseClient,
) {
  await rpc(
    "admin_unpublish_jv",
    { _jv_id: id, _reason: reason.trim() },
    client,
  );
}

/* ---------- audit log ---------- */

export async function fetchAuditLog(
  opts: { before?: number; action?: string } = {},
  client?: SupabaseClient,
): Promise<AuditEntry[]> {
  let q = sb(client)
    .from("admin_audit_log")
    .select("*")
    .order("id", { ascending: false })
    .limit(100);
  if (opts.before) q = q.lt("id", opts.before);
  if (opts.action) q = q.ilike("action", `${opts.action}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    adminId: r.admin_id,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    reason: r.reason,
    details: r.details ?? {},
    createdAt: r.created_at,
  }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Signed link (10 min) to a private file, e.g. a CAC certificate or ID card. */
export async function documentLink(
  path: string,
  bucket:
    | "company-documents"
    | "property-documents"
    | "identity-documents"
    | "listing-videos" = "company-documents",
  client?: SupabaseClient,
): Promise<string> {
  if (/^https?:\/\//.test(path)) return path;
  const { data, error } = await sb(client)
    .storage.from(bucket)
    .createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
}

/* ---------- owner side ---------- */

export async function canPublishListings(
  userId: string,
  client?: SupabaseClient,
) {
  const { data, error } = await sb(client).rpc("can_publish_listings", {
    p_user_id: userId,
  });
  if (error) return false;
  return data === true;
}

export async function requestAgentVerification(
  client?: SupabaseClient,
): Promise<VerificationStatus> {
  const { data, error } = await sb(client).rpc("request_agent_verification");
  if (error) throw error;
  return data as VerificationStatus;
}

/**
 * Show or hide one of your own listings.
 * "active" submits the listing for admin review; it goes live straight
 * away only if its current details were already approved.
 * Returns the resulting status: "active", "pending" (waiting for review) or "inactive".
 */
export async function setListingStatus(
  propertyId: string,
  status: Extract<ListingStatus, "active" | "inactive">,
  client?: SupabaseClient,
): Promise<"active" | "pending" | "inactive"> {
  if (status === "active") {
    const { data, error } = await sb(client).rpc("submit_listing_for_review", {
      _property_id: propertyId,
    });
    if (error) throw error;
    return data as "active" | "pending";
  }
  const { error } = await sb(client)
    .from("properties")
    .update({ status })
    .eq("id", propertyId);
  if (error) throw error;
  return "inactive";
}
