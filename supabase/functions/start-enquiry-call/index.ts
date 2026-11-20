import { createClient } from "npm:@supabase/supabase-js@2";
import { AccessToken } from "npm:livekit-server-sdk@2";
import { RoomAgentDispatch, RoomConfiguration } from "npm:@livekit/protocol";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Off switch: with anything other than "browser", calls stay pending.
  if (Deno.env.get("AI_CALL_CHANNEL") !== "browser") {
    return json({ error: "calls_disabled" }, 403);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "unauthorized" }, 401);

  let enquiryId: string | undefined;
  try {
    ({ enquiryId } = await req.json());
  } catch {
    /* handled below */
  }
  if (!enquiryId || !/^[0-9a-f-]{36}$/i.test(enquiryId)) {
    return json({ error: "bad_request" }, 400);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const {
    data: { user },
  } = await asUser.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  // Only the buyer on this enquiry may start the call.
  const { data: inquiry } = await asUser
    .from("inquiries")
    .select("id, listing_id, viewer_id")
    .eq("id", enquiryId)
    .maybeSingle();
  if (!inquiry || inquiry.viewer_id !== user.id) {
    return json({ error: "not_found" }, 404);
  }

  // The slug comes from the database, never from the request.
  const { data: listing } = await admin
    .from("properties")
    .select("slug")
    .eq("id", inquiry.listing_id)
    .maybeSingle();
  if (!listing?.slug) return json({ error: "listing_unavailable" }, 409);

  // Claim the call: only one request can move pending -> in_progress.
  const roomName = `enquiry-${enquiryId}`;
  const now = new Date().toISOString();
  const { data: claimed } = await admin
    .from("enquiry_calls")
    .update({
      status: "in_progress",
      channel: "browser",
      room_name: roomName,
      started_at: now,
      updated_at: now,
    })
    .eq("inquiry_id", enquiryId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (!claimed) {
    const { data: current } = await admin
      .from("enquiry_calls")
      .select("status, skip_reason")
      .eq("inquiry_id", enquiryId)
      .maybeSingle();
    return json(
      {
        error: "not_available",
        status: current?.status ?? null,
        skip_reason: current?.skip_reason ?? null,
      },
      409,
    );
  }

  try {
    const lkUrl = Deno.env.get("LIVEKIT_URL")!;
    const at = new AccessToken(
      Deno.env.get("LIVEKIT_API_KEY")!,
      Deno.env.get("LIVEKIT_API_SECRET")!,
      { identity: `buyer-${user.id}`, ttl: "10m" },
    );
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    });
    at.roomConfig = new RoomConfiguration({
      agents: [
        new RoomAgentDispatch({
          agentName: "affilhomes-enquiry",
          metadata: JSON.stringify({
            slug: listing.slug,
            inquiry_id: enquiryId,
            call_id: claimed.id,
          }),
        }),
      ],
    });
    return json({ url: lkUrl, token: await at.toJwt(), room: roomName });
  } catch (e) {
    console.error("start-enquiry-call failed", e);
    // Put the call back so the buyer can try again.
    await admin
      .from("enquiry_calls")
      .update({
        status: "pending",
        channel: null,
        room_name: null,
        started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("inquiry_id", enquiryId)
      .eq("status", "in_progress");
    return json({ error: "start_failed" }, 502);
  }
});
