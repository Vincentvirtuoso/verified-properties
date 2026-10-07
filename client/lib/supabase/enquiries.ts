import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Enquiry, ThreadEvent } from "@/types/enquiry";

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
  const who = row.last_sender_type === "system" ? "Assistant: " : mine ? "You: " : "";
  return `${who}${row.last_message}`;
}

function mapMessage(m: any): ThreadEvent {
  return {
    type: "message",
    id: m.id,
    sender:
      m.sender_type === "viewer" ? "buyer" : m.sender_type === "cs_agent" ? "agent" : "assistant",
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
    .filter((r: any) => (isAgentSide ? r.agent_id === userId : r.viewer_id === userId))
    .map(
      (r: any): Enquiry => ({
        id: r.id,
        propertyId: r.listing_id,
        propertyTitle: r.listing_title,
        propertyImage: r.listing_image ?? "",
        buyerId: r.viewer_id,
        buyerName: r.viewer_name ?? "Buyer",
        buyerAvatar: r.viewer_avatar ?? undefined,
        buyerPhone: r.contact_phone ?? undefined,
        agentId: r.agent_id,
        agentName: r.agent_name ?? "Agent",
        agentType: r.agent_type ?? "cs_agent",
        stage: r.stage,
        status: r.status,
        lastEventPreview: previewFor(r, isAgentSide),
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
    .insert({ inquiry_id: enquiryId, sender_id: senderId, sender_type: "viewer", content: text })
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
  const { error } = await supabase.from("inquiries").update({ stage }).eq("id", enquiryId);
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
