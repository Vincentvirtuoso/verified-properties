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

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(URL_, ANON, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user?.email) return json({ error: "not_authenticated" }, 401);

  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  if (!password) return json({ error: "password_required" }, 400);

  const verifier = createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: pwError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (pwError) return json({ error: "reauth_failed" }, 403);

  const { data, error } = await userClient.rpc("request_account_deletion");
  if (error) {
    const m = /^deletion_blocked: (.+)$/.exec(error.message);
    if (m)
      return json({ error: "deletion_blocked", codes: m[1].split(",") }, 409);
    console.error("request_account_deletion failed", error);
    return json({ error: "request_failed" }, 500);
  }

  return json({ scheduled_for: data });
});
