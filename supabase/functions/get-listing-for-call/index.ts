import { createClient } from "npm:@supabase/supabase-js@2";

// Fields the caller is allowed to hear. Nothing else leaves this function.
const PUBLIC_FIELDS =
  "id, title, description, category, property_type, address, city, state, country, price, currency, negotiable, bedrooms, bathrooms, area, features";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const expected = Deno.env.get("LISTING_TOOL_SECRET");
  if (!expected || req.headers.get("x-tool-secret") !== expected) {
    return json({ error: "unauthorised" }, 401);
  }

  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  // Match the public site: slugs are stored lowercase.
  const slug = body.slug?.trim().toLowerCase();
  if (!slug) {
    return json({ error: "slug required" }, 400);
  }

  // Anon client, so RLS applies the same rules as the public site.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { data, error } = await supabase
    .from("properties")
    .select(PUBLIC_FIELDS)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("listing lookup failed", error.message);
    return json({ error: "lookup failed" }, 500);
  }
  if (!data) {
    // Same response for missing and inactive, so the agent can't probe listings.
    return json({ found: false });
  }

  return json({ found: true, listing: data });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
