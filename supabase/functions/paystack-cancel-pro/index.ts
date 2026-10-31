import { createClient } from "npm:@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const APP_URL = Deno.env.get("APP_URL")!;
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const cors = {
  "Access-Control-Allow-Origin": APP_URL,
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data: userData } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (!user) return text("Unauthorized", 401);

  const { companyId } = await req.json();

  // Owner-only: the owner's profile carries companyId
  const { data: profile } = await admin
    .from("profiles") // your table that stores User
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.company_id !== companyId) {
    return text("Only the company owner can cancel", 403);
  }

  const { data: sub } = await admin
    .from("company_subscriptions")
    .select("paystack_subscription_code, paystack_email_token")
    .eq("company_id", companyId)
    .maybeSingle();

  if (!sub?.paystack_subscription_code) {
    return text("No active subscription", 404);
  }

  // Stop future charges on Paystack
  const res = await fetch("https://api.paystack.co/subscription/disable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: sub.paystack_subscription_code,
      token: sub.paystack_email_token,
    }),
  });

  if (!(await res.json()).status) {
    return text("Could not cancel", 502);
  }

  // Pro stays until current_period_end, then drops to Standard.
  // getEntitlements handles that, so only mark the status here.
  await admin
    .from("company_subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("company_id", companyId);

  return text("ok", 200);
});

function text(body: string, status: number) {
  return new Response(body, { status, headers: cors });
}
