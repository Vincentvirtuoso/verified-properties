import { createClient } from "npm:@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL")!;
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BUCKET = "company-training-documents";
const MB = 1024 * 1024;

// Keep in sync with DOCUMENT_MAX_MB in lib/ai-plans. The app uses one value
// for the per-file limit and the total storage limit.
const DOCUMENT_MAX_MB = 10;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "image/png": "png",
  "image/jpeg": "jpg",
};

type OwnerType = "company" | "agent";

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
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: userData } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  // 2. Validate input. companyId is still accepted during rollout.
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const ownerType: OwnerType = body.ownerType === "agent" ? "agent" : "company";
  const ownerId =
    typeof body.ownerId === "string"
      ? body.ownerId
      : typeof body.companyId === "string"
        ? body.companyId
        : "";
  const fileName = typeof body.fileName === "string" ? body.fileName : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
  const sizeBytes = Number(body.sizeBytes);

  if (!ownerId || !fileName || !ALLOWED_TYPES[mimeType]) {
    return json(
      { error: "Upload a PDF, Word (.docx), PNG or JPEG file." },
      400,
    );
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    return json({ error: "Invalid file size." }, 400);
  }

  // 3. Authorise the caller for this owner
  if (ownerType === "company") {
    const { data: membership } = await admin
      .from("company_members")
      .select("role")
      .eq("company_id", ownerId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (membership?.role !== "admin") {
      return json({ error: "Only company admins can upload documents." }, 403);
    }
  } else {
    if (ownerId !== user.id) {
      return json({ error: "You can only upload your own documents." }, 403);
    }
    const { data: profile } = await admin
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.roles?.includes("agent")) {
      return json({ error: "Only agents can upload agent documents." }, 403);
    }
  }

  // 4. Paid plan check, using the same ai_subscriptions rules as checkout
  const { data: sub } = await admin
    .from("ai_subscriptions")
    .select("status, current_period_end, grace_until")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!hasPaidPlan(sub)) {
    return json(
      { error: "Document training is available on a paid AI plan." },
      402,
    );
  }

  // 5. Per-file and total limits
  const limitBytes = DOCUMENT_MAX_MB * MB;
  if (sizeBytes > limitBytes) {
    return json({ error: `Each file can be up to ${DOCUMENT_MAX_MB}MB.` }, 413);
  }

  const { data: existing, error: sumError } = await admin
    .from("ai_documents")
    .select("size_bytes")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId);
  if (sumError) return json({ error: "Couldn't check storage." }, 500);

  const usedBytes = (existing ?? []).reduce(
    (sum, d) => sum + Number(d.size_bytes),
    0,
  );
  if (usedBytes + sizeBytes > limitBytes) {
    return json(
      { error: `This file would go over your ${DOCUMENT_MAX_MB}MB limit.` },
      413,
    );
  }

  // 6. Create the row, then the signed upload target.
  // The first path segment is the owner id, which the storage policies check.
  const documentId = crypto.randomUUID();
  const storagePath = `${ownerId}/${documentId}/${safeFileName(fileName, ALLOWED_TYPES[mimeType])}`;

  const { error: insertError } = await admin.from("ai_documents").insert({
    id: documentId,
    owner_type: ownerType,
    owner_id: ownerId,
    company_id: ownerType === "company" ? ownerId : null,
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
    await admin.from("ai_documents").delete().eq("id", documentId);
    return json({ error: "Couldn't start the upload." }, 500);
  }

  return json({ documentId, path: signed.path, token: signed.token });
});

/** Same rules the checkout function uses: active, or past due within the grace period. */
function hasPaidPlan(
  sub: {
    status: string;
    current_period_end: string | null;
    grace_until: string | null;
  } | null,
) {
  if (!sub) return false;
  const now = Date.now();
  if (sub.status === "active") {
    return (
      !!sub.current_period_end &&
      new Date(sub.current_period_end).getTime() > now
    );
  }
  if (sub.status === "past_due") {
    return !!sub.grace_until && new Date(sub.grace_until).getTime() > now;
  }
  return false;
}

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
