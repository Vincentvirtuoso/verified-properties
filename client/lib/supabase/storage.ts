import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type StorageBucket =
  | "property-images"
  | "property-documents"
  | "company-documents"
  | "avatars";

const PUBLIC_BUCKETS: StorageBucket[] = ["property-images", "avatars"];

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-").slice(-80);
}

/**
 * Uploads a file into "<userId>/<random>-<name>" (storage policies only
 * allow writes into the caller's own folder).
 * Returns a public URL for public buckets, or the storage path for
 * private buckets (read later with a signed URL).
 */
export async function uploadUserFile(
  bucket: StorageBucket,
  userId: string,
  file: File | Blob,
  fileName: string,
  client?: SupabaseClient,
): Promise<string> {
  const supabase = client ?? createClient();
  const path = `${userId}/${crypto.randomUUID()}-${safeName(fileName)}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: (file as File).type || undefined,
  });

  if (error) {
    throw error;
  }

  if (PUBLIC_BUCKETS.includes(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  return path;
}
