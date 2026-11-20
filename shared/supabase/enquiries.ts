import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import type { Enquiry, ThreadEvent } from "../types";

/**
 * Enquiries backed by public.inquiries / public.inquiry_messages
 * (see 009_enquiries.sql). RLS limits every read to the buyer and the
 * assigned agent (the listing owner, assigned automatically).
 */

export type EnquiryStage = Enquiry["stage"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function previewFor(row: any, isAgentSide: boolean): string {
  if (!row.last_message) return "";
  const mine =
    (isAgentSide && row.last_sender_type === "cs_agent") ||
    (!isAgentSide && row.last_sender_type === "viewer");
  const who =
    row.last_sender_type === "system" ? "Assistant: " : mine ? "You: " : "";
  return `${who}${row.last_message}`;
}

function mapMessage(m: any): ThreadEvent {
  return {
    type: "message",
    id: m.id,
    sender:
      m.sender_type === "viewer"
        ? "buyer"
        : m.sender_type === "cs_agent"
          ? "agent"
          : "assistant",
    text: m.content,
    timestamp: new Date(m.sent_at),
  };
}

/** Inbox for the signed-in user. Agent side = enquiries assigned to them. */
export async function fetchMyEnquiries(
  userId: string,
  isAgentSide: boolean,
  client?: SupabaseClient,
): Promise<Enquiry[]> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase.rpc("get_my_enquiries");
  if (error) throw error;

  return (data ?? [])
    .filter((r: any) =>
      isAgentSide ? r.agent_id === userId : r.viewer_id === userId,
    )
    .map(
      (r: any): Enquiry => ({
        id: r.id,
        propertyId: r.listing_id,
        propertyTitle: r.listing_title,
        propertyImage: r.listing_image ?? "",
        companyId: r.company_id ?? undefined,
        companyName: r.company_name ?? undefined,
        buyerId: r.viewer_id,
        buyerName: r.viewer_name ?? "Buyer",
        buyerAvatar: r.viewer_avatar ?? undefined,
        buyerPhone: r.contact_phone ?? undefined,
        agentId: r.agent_id,
        agentName: r.agent_name ?? "Agent",
        agentType: r.company_id ? "company" : "user",
        stage: r.stage,
        status: r.status,
        lastEventPreview: previewFor(r, isAgentSide),
        lastEventAt: new Date(r.last_event_at),
        unreadCount: 0,
        events: [],
      }),
    );
}

/** Every enquiry on the company's listings (company members, read-only for teammates). */
export async function fetchCompanyEnquiries(
  companyId: string,
  client?: SupabaseClient,
): Promise<Enquiry[]> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase.rpc("get_company_enquiries", {
    _company_id: companyId,
  });
  if (error) throw error;
  return (data ?? []).map(
    (r: any): Enquiry => ({
      id: r.id,
      propertyId: r.listing_id,
      propertyTitle: r.listing_title,
      propertyImage: r.listing_image ?? "",
      companyId: r.company_id ?? undefined,
      companyName: r.company_name ?? undefined,
      contactUserId: r.company_id ? r.agent_id : undefined,
      contactUserName: r.company_id ? (r.agent_name ?? undefined) : undefined,
      buyerId: r.viewer_id,
      buyerName: r.viewer_name ?? "Buyer",
      buyerAvatar: r.viewer_avatar ?? undefined,
      buyerPhone: r.contact_phone ?? undefined,
      agentId: r.agent_id,
      agentName: r.agent_name ?? "Agent",
      agentType: "company",
      stage: r.stage,
      status: r.status,
      lastEventPreview: previewFor(r, true),
      lastEventAt: new Date(r.last_event_at),
      unreadCount: 0,
      events: [],
    }),
  );
}

export async function fetchEnquiryMessages(
  enquiryId: string,
  client?: SupabaseClient,
): Promise<ThreadEvent[]> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("inquiry_messages")
    .select("id, sender_type, content, sent_at")
    .eq("inquiry_id", enquiryId)
    .order("sent_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMessage);
}

export async function markEnquiryRead(enquiryId: string, userId: string) {
  const { error } = await createClient().from("enquiry_read_state").upsert(
    {
      enquiry_id: enquiryId,
      user_id: userId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "enquiry_id,user_id" },
  );
  if (error) throw error;
}

export async function fetchTeamEnquiryMessages(
  enquiryId: string,
  client?: SupabaseClient,
): Promise<ThreadEvent[]> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase.rpc("get_company_enquiry_messages", {
    _inquiry_id: enquiryId,
  });
  if (error) throw error;
  return (data ?? []).map(mapMessage);
}

export async function sendEnquiryMessage(
  enquiryId: string,
  senderId: string,
  text: string,
  client?: SupabaseClient,
): Promise<ThreadEvent> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("inquiry_messages")
    // sender_type is overwritten by the database from who is sending.
    .insert({
      inquiry_id: enquiryId,
      sender_id: senderId,
      sender_type: "viewer",
      content: text,
    })
    .select("id, sender_type, content, sent_at")
    .single();
  if (error) throw error;
  return mapMessage(data);
}

export async function updateEnquiryStage(
  enquiryId: string,
  stage: EnquiryStage,
  client?: SupabaseClient,
) {
  const supabase = client ?? createClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ stage })
    .eq("id", enquiryId);
  if (error) throw error;
}

/** Sends an enquiry from a property page; returns the enquiry id. */
export async function createEnquiry(
  input: { propertyId: string; name: string; phone: string; message: string },
  client?: SupabaseClient,
): Promise<string> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase.rpc("create_enquiry", {
    _listing_id: input.propertyId,
    _contact_name: input.name,
    _contact_phone: input.phone,
    _message: input.message,
  });
  if (error) throw error;
  return data as string;
}

/** The buyer's active enquiry on a listing, if any (create_enquiry reuses it). */
export async function findActiveEnquiry(
  listingId: string,
  viewerId: string,
  client?: SupabaseClient,
): Promise<string | null> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("id")
    .eq("listing_id", listingId)
    .eq("viewer_id", viewerId)
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0]?.id ?? null;
}

export type EnquiryCallRow = {
  id: string;
  inquiry_id: string;
  status: "pending" | "skipped" | "in_progress" | "completed" | "failed";
  skip_reason: string | null;
  channel: "browser" | "phone" | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  summary: string | null;
};

export async function fetchEnquiryCall(
  enquiryId: string,
  client?: SupabaseClient,
): Promise<EnquiryCallRow | null> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("enquiry_calls")
    .select(
      "id, inquiry_id, status, skip_reason, channel, started_at, ended_at, duration_seconds, summary",
    )
    .eq("inquiry_id", enquiryId)
    .maybeSingle();
  if (error) throw error;
  return data as EnquiryCallRow | null;
}

export class StartCallError extends Error {
  constructor(
    public code: string,
    public status?: string | null,
    public skipReason?: string | null,
  ) {
    super(code);
  }
}

export async function startEnquiryCall(
  enquiryId: string,
  client?: SupabaseClient,
): Promise<{ url: string; token: string; room: string }> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase.functions.invoke(
    "start-enquiry-call",
    { body: { enquiryId } },
  );
  if (error) {
    let body: any = null;
    try {
      body = await (error as any).context?.json();
    } catch {}
    throw new StartCallError(
      body?.error ?? "start_failed",
      body?.status ?? null,
      body?.skip_reason ?? null,
    );
  }
  return data;
}

/** Turns a finished call row into a thread event for CallCard. */
export function callRowToEvent(row: EnquiryCallRow | null): ThreadEvent | null {
  if (!row || (row.status !== "completed" && row.status !== "failed")) {
    return null;
  }
  return {
    type: "call",
    id: `call-${row.id}`,
    caller: "assistant",
    outcome: row.status === "completed" ? "answered" : "missed",
    timestamp: new Date(row.started_at ?? row.ended_at ?? Date.now()),
    durationSeconds: row.duration_seconds ?? 0,
    summary: row.summary ?? undefined,
  } as ThreadEvent;
}