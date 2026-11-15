import { AgentDispatchClient } from "npm:livekit-server-sdk@2";

const dispatch = new AgentDispatchClient(
  Deno.env.get("LIVEKIT_URL")!,
  Deno.env.get("LIVEKIT_API_KEY")!,
  Deno.env.get("LIVEKIT_API_SECRET")!,
);

const LIVE_CALLS = Deno.env.get("ENABLE_LIVE_CALLS") === "true";

// Call this after the enquiry row is saved and eligibility has passed.
export async function startEnquiryCall(enquiryId: string, slug: string) {
  if (!LIVE_CALLS) {
    console.log("live calls disabled; enquiry saved without a call", enquiryId);
    return null;
  }
  const roomName = `enquiry-${enquiryId}`;
  await dispatch.createDispatch(roomName, "affilhomes-enquiry", {
    metadata: JSON.stringify({ slug, enquiry_id: enquiryId }),
  });
  return roomName;
}
