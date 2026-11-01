import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://affilhomes.com";
const BUCKET = "company-documents";
const MAX_CAC_BYTES = 5 * 1024 * 1024;

const cors = {
  "Access-Control-Allow-Origin": APP_URL,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const ownedCacPath = (path: unknown, userId: string): path is string =>
  typeof path === "string" &&
  new RegExp(
    "^" + userId +
      "/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-[a-z0-9._-]{0,80}$",
  ).test(path);

async function downloadAndHash(userClient: ReturnType<typeof createClient>, path: string) {
  const { data, error } = await userClient.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error("The CAC file is missing or you cannot access it.");
  if (data.size <= 0 || data.size > MAX_CAC_BYTES) {
    throw new Error("The CAC file must be between 1 byte and 5 MB.");
  }
  const digest = await crypto.subtle.digest("SHA-256", await data.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in to submit your application." }, 401);
  const payload = await req.json().catch(() => null);
  if (!payload || !["submit", "verify_submitted"].includes(payload.action)) {
    return json({ error: "Invalid registration request." }, 400);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  const user = authData.user;
  if (authError || !user) return json({ error: "Your session is invalid. Sign in again." }, 401);

  // The service key stays in the Edge Function environment. Database RPCs also
  // require the service_role claim and are not executable by browser roles.
  const trustedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (payload.action === "verify_submitted") {
      const { data: registration, error } = await userClient
        .from("company_registrations")
        .select("id, status, cac_cert_path, cac_sha256_verified_at")
        .eq("user_id", user.id)
        .eq("status", "docs_submitted")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!registration) return json({ ok: true, skipped: true });
      if (registration.cac_sha256_verified_at) return json({ ok: true, alreadyVerified: true });
      if (!ownedCacPath(registration.cac_cert_path, user.id)) {
        throw new Error("The submitted CAC reference is invalid or does not belong to your account.");
      }
      const hash = await downloadAndHash(userClient, registration.cac_cert_path);
      const { error: rpcError } = await trustedClient.rpc(
        "record_company_registration_cac_hash",
        {
          p_user_id: user.id,
          p_registration_id: registration.id,
          p_cac_path: registration.cac_cert_path,
          p_cac_hash: hash,
        },
      );
      if (rpcError) throw rpcError;
      return json({ ok: true });
    }

    const [{ data: draft, error: draftError }, { data: rejected, error: rejectedError }] =
      await Promise.all([
        userClient
          .from("company_registrations")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("status", "draft")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        userClient
          .from("company_registrations")
          .select("id, status, cac_cert_path, cac_sha256, rejection_scope, updated_at")
          .eq("user_id", user.id)
          .eq("status", "rejected")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
    if (draftError) throw draftError;
    if (rejectedError) throw rejectedError;
    if (!draft) throw new Error("Save your application as a draft before submitting.");

    let cacPath: string | null = payload.cacPath ?? null;
    const reuseExisting = !cacPath && rejected?.rejection_scope === "details";
    if (reuseExisting) cacPath = rejected.cac_cert_path;
    if (!ownedCacPath(cacPath, user.id)) {
      throw new Error("Upload a valid CAC certificate from your account before submitting.");
    }
    const hash = await downloadAndHash(userClient, cacPath);

    let lastRejectedPath: string | null = null;
    let lastRejectedHash: string | null = null;
    if (rejected?.rejection_scope === "cac_document") {
      if (!ownedCacPath(rejected.cac_cert_path, user.id)) {
        throw new Error("The previously rejected CAC reference is invalid.");
      }
      lastRejectedPath = rejected.cac_cert_path;
      // Hash prior object bytes too; stored and browser-supplied digests aren't
      // trusted when determining whether the new certificate differs.
      lastRejectedHash = await downloadAndHash(userClient, lastRejectedPath);
    } else if (reuseExisting && cacPath !== rejected?.cac_cert_path) {
      throw new Error("The existing CAC document is no longer eligible for reuse.");
    }

    const { data: registrationId, error: submitError } = await trustedClient.rpc(
      "finalize_company_registration",
      {
        p_user_id: user.id,
        p_cac_path: cacPath,
        p_logo_url: typeof payload.logoUrl === "string" ? payload.logoUrl : null,
        p_authorised: payload.authorised === true,
        p_cac_hash: hash,
        p_reuse_existing: reuseExisting,
        p_last_rejected_cac_path: lastRejectedPath,
        p_last_rejected_cac_hash: lastRejectedHash,
      },
    );
    if (submitError) throw submitError;
    return json({ ok: true, registrationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not process your registration.";
    return json({ error: message }, 400);
  }
});
