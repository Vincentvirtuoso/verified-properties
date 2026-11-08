import { createClient } from "npm:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const userClient = createClient(URL_, ANON, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user?.email) return json({ error: "not_authenticated" }, 401);

  let body: { password?: string; companyId?: string; companyName?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const { password, companyId, companyName } = body;
  if (!password || !companyId || !companyName)
    return json({ error: "invalid_body" }, 400);

  // Verify with a throwaway client so the caller's session is untouched.
  const verifier = createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: pwError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (pwError) return json({ error: "reauth_failed" }, 403);

  const { error } = await userClient.rpc("close_company", {
    p_company_id: companyId,
    p_company_name: companyName,
  });

  if (error) {
    const blocked = /closure_blocked: (.+)$/.exec(error.message);
    if (blocked)
      return json(
        { error: "closure_blocked", codes: blocked[1].split(",") },
        409,
      );
    if (error.message.includes("name_mismatch"))
      return json({ error: "name_mismatch" }, 422);
    if (error.message.includes("not_owner_or_not_found"))
      return json({ error: "not_owner" }, 403);
    console.error("close_company failed", error);
    return json({ error: "close_failed" }, 500);
  }

  return json({ ok: true });
});
