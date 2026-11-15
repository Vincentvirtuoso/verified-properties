import { createClient } from "npm:@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const APP_URL = Deno.env.get("APP_URL")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": APP_URL,
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const userDb = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: userData } = await userDb.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ error: "Please sign in." }, 401);

  const { ownerType, companyId } = await req.json();
  if (ownerType !== "company" && ownerType !== "agent") {
    return json({ error: "Invalid owner." }, 400);
  }
  const ownerId = ownerType === "agent" ? user.id : companyId;
  if (!ownerId) return json({ error: "Missing company." }, 400);

  const { data: allowed } = await userDb.rpc("can_manage_ai_billing", {
    p_owner_type: ownerType,
    p_owner_id: ownerId,
  });
  if (!allowed) {
    return json(
      {
        error: "You don't have permission to manage billing for this company.",
      },
      403,
    );
  }

  const { data: sub } = await admin
    .from("ai_subscriptions")
    .select(
      "status, paystack_subscription_code, paystack_email_token, trial_ends_at, current_period_end, grace_until",
    )
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!sub) return json({ error: "No AI plan to cancel." }, 404);

  // Already cancelled: nothing to do.
  if (sub.status === "canceled") {
    return json({ ok: true, periodEnd: sub.current_period_end });
  }
  if (!sub.paystack_subscription_code || !sub.paystack_email_token) {
    return json({ error: "No billing subscription found for this plan." }, 409);
  }

  // Stop future charges first. If Paystack refuses, nothing changes locally.
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
  const body = await res.json();
  if (!body.status) {
    console.error("Cancel failed", body);
    return json({ error: "Could not cancel. Please try again." }, 502);
  }

  // Access runs to the end of what was already paid for, or the trial end.
  const periodEnd =
    sub.status === "trialing"
      ? sub.trial_ends_at
      : sub.status === "past_due"
        ? sub.grace_until
        : sub.current_period_end;

  const { error } = await admin
    .from("ai_subscriptions")
    .update({
      status: "canceled",
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId);

  if (error) {
    console.error("Cancel saved in Paystack but not in the database", error);
    return json(
      {
        error:
          "Cancelled with Paystack, but the plan didn't update. Contact support.",
      },
      500,
    );
  }

  return json({ ok: true, periodEnd });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
