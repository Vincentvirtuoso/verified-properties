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
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { companyId } = await req.json();

  // Owner-only
  const { data: company } = await admin
    .from("companies")
    .select("id, owner_id")
    .eq("id", companyId)
    .single();
  if (!company || company.owner_id !== user.id) {
    return json({ error: "Only the company owner can manage billing" }, 403);
  }

  const { data: sub } = await admin
    .from("company_subscriptions")
    .select("status, trial_used, current_period_end")
    .eq("company_id", companyId)
    .maybeSingle();

  if (sub && ["trialing", "active", "past_due"].includes(sub.status)) {
    return json({ error: "Pro is already active" }, 409);
  }

  // Card verification charge. The webhook creates the subscription on success.
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: 5_000,
      callback_url: `${APP_URL}/company/pro?verify=1`,
      metadata: {
        purpose: "pro_start",
        company_id: companyId,
        trial: !sub?.trial_used,
      },
    }),
  });
  const body = await res.json();
  if (!body.status) return json({ error: "Could not start payment" }, 502);

  return json({ url: body.data.authorization_url });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
