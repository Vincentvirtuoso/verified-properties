import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getEntitlements,
  type SubscriptionRow,
} from "../_shared/entitlements.ts";

const APP_URL = Deno.env.get("APP_URL")!;
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BUCKET = "company-training-documents";
const MB = 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "image/png": "png",
  "image/jpeg": "jpg",
};

const cors = {
  "Access-Control-Allow-Origin": APP_URL,
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // 1. Authenticate
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data: userData } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  // 2. Validate input
  let body: {
    companyId?: unknown;
    fileName?: unknown;
    mimeType?: unknown;
    sizeBytes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const companyId = typeof body.companyId === "string" ? body.companyId : "";
  const fileName = typeof body.fileName === "string" ? body.fileName : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
  const sizeBytes = Number(body.sizeBytes);

  if (!companyId || !fileName || !ALLOWED_TYPES[mimeType]) {
    return json(
      { error: "Upload a PDF, Word (.docx), PNG or JPEG file." },
      400,
    );
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    return json({ error: "Invalid file size." }, 400);
  }

  // 3. Caller must be an admin of this company
  const { data: membership } = await admin
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "admin") {
    return json({ error: "Only company admins can upload documents." }, 403);
  }

  // 4. Company must be on Pro
  const { data: subRow } = await admin
    .from("company_subscriptions")
    .select(
      "status, trial_used, trial_ends_at, current_period_end, grace_until",
    )
    .eq("company_id", companyId)
    .maybeSingle();

  const ent = getEntitlements(subRow as SubscriptionRow | null);
  if (!ent.training.documents) {
    return json({ error: "Document training is available on Pro." }, 402);
  }

  // 5. Per-file and total limits
  const limitBytes = ent.training.documentMaxMb * MB;
  if (sizeBytes > limitBytes) {
    return json(
      { error: `Each file can be up to ${ent.training.documentMaxMb}MB.` },
      413,
    );
  }

  const { data: existing, error: sumError } = await admin
    .from("ai_documents")
    .select("size_bytes")
    .eq("company_id", companyId);

  if (sumError) return json({ error: "Couldn't check storage." }, 500);

  const usedBytes = (existing ?? []).reduce(
    (sum, d) => sum + Number(d.size_bytes),
    0,
  );
  if (usedBytes + sizeBytes > limitBytes) {
    return json(
      {
        error: `This file would go over your ${ent.training.documentMaxMb}MB limit.`,
      },
      413,
    );
  }

  // 6. Create the row, then the signed upload target
  const documentId = crypto.randomUUID();
  const storagePath = `${companyId}/${documentId}/${safeFileName(fileName, ALLOWED_TYPES[mimeType])}`;

  const { error: insertError } = await admin.from("ai_documents").insert({
    id: documentId,
    company_id: companyId,
    uploaded_by: user.id,
    file_name: fileName.slice(0, 255),
    mime_type: mimeType,
    size_bytes: sizeBytes,
    storage_path: storagePath,
    status: "uploaded",
  });

  if (insertError) return json({ error: "Couldn't start the upload." }, 500);

  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (signError || !signed) {
    // Roll back the row so no record points at a file that was never uploaded
    await admin.from("ai_documents").delete().eq("id", documentId);
    return json({ error: "Couldn't start the upload." }, 500);
  }

  return json({
    documentId,
    path: signed.path,
    token: signed.token,
  });
});

/** Keep the name readable and safe for storage paths. The extension follows the MIME type. */
function safeFileName(name: string, ext: string) {
  const base =
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[^A-Za-z0-9 _-]+/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100) || "document";
  return `${base}.${ext}`;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
