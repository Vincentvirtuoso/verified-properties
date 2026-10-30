import { createClient } from "npm:@supabase/supabase-js@2";

const TRIAL_DAYS = 7;
const PAST_DUE_GRACE_DAYS = 3;

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const PLAN_CODE = Deno.env.get("PAYSTACK_PRO_PLAN_CODE")!;
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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

Deno.serve(async (req) => {
  const body = await req.text();
  if (!(await verifySignature(body, req.headers.get("x-paystack-signature")))) {
    return new Response("invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);
  const d = event.data;

  switch (event.event) {
    case "charge.success":
      if (d.metadata?.purpose === "pro_start") await startPro(d);
      break;

    case "invoice.update": // successful renewal or first charge
      await updateBySubscription(d.subscription.subscription_code, {
        status: "active",
        current_period_end: d.subscription.next_payment_date,
        grace_until: null,
      });
      break;

    case "invoice.payment_failed":
      await updateBySubscription(d.subscription.subscription_code, {
        status: "past_due",
        grace_until: new Date(
          Date.now() + PAST_DUE_GRACE_DAYS * 86_400_000,
        ).toISOString(),
      });
      break;

    case "subscription.disable":
      await updateBySubscription(d.subscription_code, { status: "canceled" });
      break;
  }

  return new Response("ok", { status: 200 });
});

async function startPro(charge: any) {
  const companyId = charge.metadata.company_id;
  const auth = charge.authorization;

  if (!auth?.reusable) {
    console.error("Card is not reusable", companyId);
    return;
  }

  const { data: row } = await admin
    .from("company_subscriptions")
    .select("status, trial_used, paystack_subscription_code")
    .eq("company_id", companyId)
    .maybeSingle();

  // Idempotency: Paystack can deliver the same event more than once
  if (row?.paystack_subscription_code) return;

  const trial = !row?.trial_used;
  const startDate = trial
    ? new Date(Date.now() + TRIAL_DAYS * 86_400_000)
    : new Date();

  const res = await fetch("https://api.paystack.co/subscription", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: charge.customer.email,
      plan: PLAN_CODE,
      authorization: auth.authorization_code,
      start_date: startDate.toISOString(),
    }),
  });
  const sub = await res.json();
  if (!sub.status) {
    console.error("Subscription create failed", sub);
    return;
  }

  await admin.from("company_subscriptions").upsert(
    {
      company_id: companyId,
      status: trial ? "trialing" : "active",
      trial_used: row?.trial_used || trial,
      trial_ends_at: trial ? startDate.toISOString() : null,
      current_period_end: startDate.toISOString(),
      paystack_customer_code: charge.customer.customer_code,
      paystack_subscription_code: sub.data.subscription_code,
      paystack_email_token: sub.data.email_token,
      paystack_authorization_code: auth.authorization_code,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );
}

async function updateBySubscription(
  code: string,
  patch: Record<string, unknown>,
) {
  await admin
    .from("company_subscriptions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("paystack_subscription_code", code);
}
