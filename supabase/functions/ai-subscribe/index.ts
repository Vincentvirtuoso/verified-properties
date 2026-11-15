import { createClient } from "npm:@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const APP_URL = Deno.env.get("APP_URL")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TIERS: Record<string, { amountKobo: number }> = {
  starter: { amountKobo: 10_000_000 },
  growth: { amountKobo: 20_000_000 },
  business: { amountKobo: 40_000_000 },
};
const TRIAL_CHARGE_KOBO = 5_000;

const cors = {
  "Access-Control-Allow-Origin": APP_URL,
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";

  // User-scoped client, so auth.uid() works inside can_manage_ai_billing.
  const userDb = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: userData } = await userDb.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ error: "Please sign in." }, 401);

  const { ownerType, companyId, tier, trial } = await req.json();
  const isTrial = trial === true;

  if (!TIERS[tier])
    return json({ error: "Choose Starter, Growth or Business." }, 400);
  if (ownerType !== "company" && ownerType !== "agent") {
    return json({ error: "Invalid owner." }, 400);
  }
  const ownerId = ownerType === "agent" ? user.id : companyId;
  if (!ownerId) return json({ error: "Missing company." }, 400);

  // One profile lookup covers the email check and the agent check.
  const { data: profile } = await admin
    .from("profiles")
    .select("is_email_verified, agent_profile")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_email_verified) {
    return json(
      { error: "Verify your email before choosing an AI plan." },
      403,
    );
  }

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

  if (ownerType === "company") {
    const { data: company } = await admin
      .from("companies")
      .select("verification_status")
      .eq("id", ownerId)
      .maybeSingle();
    if (company?.verification_status !== "verified") {
      return json(
        {
          error:
            "AI calling becomes available once your CAC verification is approved.",
        },
        403,
      );
    }
  }

  if (ownerType === "agent") {
    const status = (
      profile.agent_profile as { verificationStatus?: string } | null
    )?.verificationStatus;
    if (status !== "verified") {
      return json(
        {
          error:
            "AI calling becomes available once your agent verification is approved.",
        },
        403,
      );
    }
  }

  const { data: sub } = await admin
    .from("ai_subscriptions")
    .select(
      "status, trial_used, trial_ends_at, current_period_end, grace_until",
    )
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .maybeSingle();

  const now = Date.now();
  const trialing =
    sub?.status === "trialing" && new Date(sub.trial_ends_at).getTime() > now;
  const paidLive =
    !!sub &&
    !trialing &&
    ((sub.status === "active" &&
      new Date(sub.current_period_end).getTime() > now) ||
      (sub.status === "past_due" && new Date(sub.grace_until).getTime() > now));

  if (paidLive)
    return json({ error: "An AI plan is already active for this owner." }, 409);
  if (isTrial && (trialing || sub?.trial_used))
    return json({ error: "The free trial has already been used." }, 409);

  const callbackPath =
    ownerType === "agent" ? "/dashboard/ai-plans" : "/company/ai-plans";

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: isTrial ? TRIAL_CHARGE_KOBO : TIERS[tier].amountKobo,
      callback_url: `${APP_URL}${callbackPath}?verify=1`,
      metadata: {
        purpose: isTrial ? "ai_trial" : "ai_start",
        owner_type: ownerType,
        owner_id: ownerId,
        tier,
      },
    }),
  });

  const body = await res.json();
  if (!body.status) return json({ error: "Could not start payment." }, 502);

  return json({ url: body.data.authorization_url });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
