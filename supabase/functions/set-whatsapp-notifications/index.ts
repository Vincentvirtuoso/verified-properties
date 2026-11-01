import { createClient } from "npm:@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL")!;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Please sign in again." }, 401);

  const body = await req.json().catch(() => null);
  const companyId = typeof body?.companyId === "string" ? body.companyId : "";
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : null;
  if (!companyId || enabled === null) {
    return json({ error: "Invalid request." }, 400);
  }

  // Runs as the signed-in user, so the SQL function sees auth.uid().
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    },
  );

  const { error } = await supabase.rpc("set_whatsapp_notifications", {
    p_company_id: companyId,
    p_enabled: enabled,
  });

  if (error) {
    if (error.code === "42501") return json({ error: error.message }, 403);
    if (error.code === "22023") return json({ error: error.message }, 400);
    return json(
      {
        error: "Couldn't save. Please try again.",
        detail: error.message,
        code: error.code,
      },
      500,
    );
  }

  return json({ ok: true, whatsappNotifications: enabled });
});
