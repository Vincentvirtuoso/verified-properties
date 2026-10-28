import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "company-documents";
const BATCH_SIZE = 200;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${SERVICE_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { data: expired, error } = await supabase
    .from("cac_expired_files")
    .select("id, cac_cert_path")
    .limit(BATCH_SIZE);

  if (error) return new Response(error.message, { status: 500 });
  if (!expired?.length) return Response.json({ removed: 0 });

  const paths = [...new Set(expired.map((r) => r.cac_cert_path as string))];

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove(paths);
  if (storageError) return new Response(storageError.message, { status: 500 });

  const { error: updateError } = await supabase
    .from("company_registrations")
    .update({ cac_cert_path: null, file_removed_at: new Date().toISOString() })
    .in(
      "id",
      expired.map((r) => r.id),
    );
  if (updateError) return new Response(updateError.message, { status: 500 });

  return Response.json({
    removed: paths.length,
    registrations: expired.length,
  });
});
