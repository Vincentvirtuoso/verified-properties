// supabase/functions/invite-company-member/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL =
  Deno.env.get("INVITE_FROM_EMAIL") ?? "Affilhomes <no-reply@affilhomes.com>";

const cors = {
  "Access-Control-Allow-Origin": APP_URL,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Sign in to send invitations" }, 401);

  const body = await req.json().catch(() => null);
  const companyId = body?.companyId;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role;
  const permissions = Array.isArray(body?.permissions) ? body.permissions : [];

  if (!companyId || !email || !role) {
    return json({ error: "Missing invitation details" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    },
  );

  const { data: token, error: rpcError } = await supabase.rpc(
    "create_company_invitation",
    {
      p_company_id: companyId,
      p_email: email,
      p_role: role,
      p_permissions: permissions,
    },
  );
  if (rpcError) return json({ error: rpcError.message }, 400);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: company }, { data: inviter }] = await Promise.all([
    supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
    supabase.from("profiles").select("name").eq("id", user!.id).maybeSingle(),
  ]);

  const companyName = company?.name ?? "a company";
  const link = `${APP_URL}/invite?token=${encodeURIComponent(token as string)}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: `You're invited to join ${companyName} on Affilhomes`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#111">
          <h2 style="margin-bottom:8px">You're invited to join ${escapeHtml(companyName)}</h2>
          <p>${escapeHtml(inviter?.name ?? "A team admin")} invited you to join
             ${escapeHtml(companyName)} on Affilhomes as ${role === "admin" ? "an admin" : "a team member"}.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">
              Accept invitation
            </a>
          </p>
          <p style="color:#555;font-size:13px">
            Sign in, or create an account, with this email address to accept.
            The link works once and expires in 7 days.
          </p>
        </div>`,
    }),
  });

  if (!res.ok) {
    return json(
      {
        error:
          "The invitation was saved, but the email couldn't be sent. Send it again.",
      },
      502,
    );
  }

  return json({ ok: true });
});
