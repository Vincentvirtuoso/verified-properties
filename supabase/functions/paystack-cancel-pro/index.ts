import { createClient } from "npm:@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data: userData } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { companyId } = await req.json();

  const { data: company } = await admin
    .from("companies")
    .select("owner_id")
    .eq("id", companyId)
    .single();
  if (company?.owner_id !== user.id) {
    return new Response("Only the company owner can cancel", { status: 403 });
  }

  const { data: sub } = await admin
    .from("company_subscriptions")
    .select("paystack_subscription_code, paystack_email_token")
    .eq("company_id", companyId)
    .maybeSingle();
  if (!sub?.paystack_subscription_code) {
    return new Response("No active subscription", { status: 404 });
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
    return new Response("Could not cancel", { status: 502 });
  }

  // Pro stays until current_period_end, then drops to Standard.
  // getEntitlements handles that. Mark as canceled and keep the period end.
  await admin
    .from("company_subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("company_id", companyId);

  return new Response("ok");
});
