import { createClient } from "npm:@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const PLAN_CODES: Record<string, string> = {
  starter: Deno.env.get("PAYSTACK_STARTER_PLAN_CODE")!,
  growth: Deno.env.get("PAYSTACK_GROWTH_PLAN_CODE")!,
  business: Deno.env.get("PAYSTACK_BUSINESS_PLAN_CODE")!,
};
const TRIAL_DAYS = 7;
const PERIOD_DAYS = 30;
const GRACE_DAYS = 3;

Deno.serve(async (req) => {
  const body = await req.text();
  if (!(await verifySignature(body, req.headers.get("x-paystack-signature")))) {
    return new Response("invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);
  const d = event.data;

  switch (event.event) {
    case "charge.success":
      if (d.metadata?.purpose === "ai_trial") await startSubscription(d, true);
      if (d.metadata?.purpose === "ai_start") await startSubscription(d, false);
      break;

    case "invoice.update":
      // Only extend the period when the invoice is actually paid.
      if (d.paid !== true || !d.subscription?.subscription_code) break;
      await updateBySubscription(d.subscription.subscription_code, {
        status: "active",
        current_period_end: d.subscription.next_payment_date,
        grace_until: null,
      });
      break;

    case "invoice.payment_failed":
      if (!d.subscription?.subscription_code) break;
      await updateBySubscription(d.subscription.subscription_code, {
        status: "past_due",
        grace_until: new Date(
          Date.now() + GRACE_DAYS * 86_400_000,
        ).toISOString(),
      });
      break;

    case "subscription.disable":
      await updateBySubscription(d.subscription_code, { status: "canceled" });
      break;
  }

  return new Response("ok", { status: 200 });
});

async function startSubscription(charge: any, trial: boolean) {
  const { owner_type, owner_id, tier } = charge.metadata;
  const auth = charge.authorization;

  if (!auth?.reusable || !PLAN_CODES[tier]) {
    console.error("Cannot start AI subscription", { owner_id, tier });
    if (trial) await refund(charge.reference);
    return;
  }

  const { data: existing } = await admin
    .from("ai_subscriptions")
    .select(
      "status, paystack_subscription_code, paystack_email_token, last_charge_reference",
    )
    .eq("owner_type", owner_type)
    .eq("owner_id", owner_id)
    .maybeSingle();

  // Paystack resent this exact charge. The first delivery already did the work.
  if (existing?.last_charge_reference === charge.reference) return;

  // Paid start over a trial: stop the trial's day-7 billing first, so the owner
  // is never charged twice. If that fails, refund this charge and stop.
  if (
    !trial &&
    existing?.status === "trialing" &&
    existing.paystack_subscription_code
  ) {
    const off = await paystack("/subscription/disable", {
      code: existing.paystack_subscription_code,
      token: existing.paystack_email_token,
    });
    if (!off.status) {
      console.error("Could not disable trial subscription", existing, off);
      await refund(charge.reference);
      return;
    }
  }

  // Trial: first real charge in 7 days. Paid: this charge covers the first 30 days.
  const startDate = new Date(
    Date.now() + (trial ? TRIAL_DAYS : PERIOD_DAYS) * 86_400_000,
  );

  const sub = await paystack("/subscription", {
    customer: charge.customer.email,
    plan: PLAN_CODES[tier],
    authorization: auth.authorization_code,
    start_date: startDate.toISOString(),
  });

  if (!sub.status) {
    console.error("Subscription create failed", sub);
    if (trial) await refund(charge.reference);
    return;
  }

  const { error } = await admin.from("ai_subscriptions").upsert(
    {
      owner_type,
      owner_id,
      tier,
      status: trial ? "trialing" : "active",
      trial_used: true,
      trial_ends_at: trial ? startDate.toISOString() : null,
      current_period_end: startDate.toISOString(),
      grace_until: null,
      paystack_customer_code: charge.customer.customer_code,
      paystack_subscription_code: sub.data.subscription_code,
      paystack_email_token: sub.data.email_token,
      paystack_authorization_code: auth.authorization_code,
      last_charge_reference: charge.reference,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_type,owner_id" },
  );
  if (error) console.error("ai_subscriptions upsert failed", error);

  if (trial) await refund(charge.reference);
}

async function refund(reference: string) {
  const res = await paystack("/refund", { transaction: reference });
  if (!res.status) console.error("Refund failed", reference, res);
}

async function updateBySubscription(
  code: string,
  patch: Record<string, unknown>,
) {
  await admin
    .from("ai_subscriptions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("paystack_subscription_code", code);
}

async function paystack(path: string, body: unknown) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function verifySignature(body: string, signature: string | null) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PAYSTACK_SECRET),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  const hex = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}
