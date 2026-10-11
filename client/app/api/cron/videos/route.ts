import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { setYouTubePrivacy, uploadToYouTube, youtubeConfigured } from "@/lib/youtube";

/**
 * GET /api/cron/videos — scheduled housekeeping (run every ~15 minutes).
 * Caller must send "Authorization: Bearer <CRON_SECRET>".
 *  1. Posts approved videos that haven't reached YouTube yet (retries).
 *  2. Sets videos to unlisted / public to follow their listing's status.
 *  3. Deletes rejected video files 30 days after rejection (unless an
 *     appeal is open).
 * This is the only place that uses the service-role key: it runs with no
 * user session. Every action is written to the audit log as "system".
 */
export const runtime = "nodejs";
export const maxDuration = 300;

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const log = (action: string, id: string, details: Record<string, unknown> = {}) =>
    db.from("admin_audit_log").insert({ admin_id: null, action, target_type: "video", target_id: id, details });
  const report = { posted: 0, privacyChanged: 0, deleted: 0, errors: [] as string[] };
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  if (youtubeConfigured()) {
    // 1. approved but not posted
    const { data: toPost } = await db
      .from("listing_videos")
      .select("id, storage_path, youtube_desired_privacy, properties(title, slug, status)")
      .eq("status", "approved")
      .is("youtube_video_id", null)
      .limit(3);
    for (const v of (toPost ?? []) as any[]) {
      try {
        const signed = await db.storage.from("listing-videos").createSignedUrl(v.storage_path, 3600);
        if (signed.error) throw signed.error;
        const privacy = v.youtube_desired_privacy === "unlisted" ? "unlisted" : "public";
        const ytId = await uploadToYouTube({
          sourceUrl: signed.data.signedUrl,
          title: v.properties?.title ?? "Affilhomes property",
          description: `View this verified property on Affilhomes: ${site}/properties/${v.properties?.slug ?? ""}`,
          privacy,
        });
        await db
          .from("listing_videos")
          .update({ youtube_video_id: ytId, youtube_privacy: privacy, youtube_error: null })
          .eq("id", v.id);
        await log("system.video_posted", v.id, { youtube_video_id: ytId, privacy });
        report.posted++;
      } catch (e: any) {
        await db.from("listing_videos").update({ youtube_error: String(e?.message ?? e).slice(0, 500) }).eq("id", v.id);
        report.errors.push(`${v.id}: ${e?.message ?? e}`);
      }
    }

    // 2. privacy follows listing status
    const { data: drift } = await db
      .from("listing_videos")
      .select("id, youtube_video_id, youtube_privacy, youtube_desired_privacy")
      .not("youtube_video_id", "is", null)
      .not("youtube_desired_privacy", "is", null)
      .limit(50);
    for (const v of (drift ?? []) as any[]) {
      if (v.youtube_privacy === v.youtube_desired_privacy) continue;
      try {
        await setYouTubePrivacy(v.youtube_video_id, v.youtube_desired_privacy);
        await db.from("listing_videos").update({ youtube_privacy: v.youtube_desired_privacy }).eq("id", v.id);
        await log(`system.video_${v.youtube_desired_privacy}`, v.id, { youtube_video_id: v.youtube_video_id });
        report.privacyChanged++;
      } catch (e: any) {
        report.errors.push(`${v.id}: ${e?.message ?? e}`);
      }
    }
  }

  // 3. delete rejected files after 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: old } = await db
    .from("listing_videos")
    .select("id, storage_path")
    .eq("status", "rejected")
    .is("storage_deleted_at", null)
    .lt("reviewed_at", cutoff)
    .limit(100);
  for (const v of (old ?? []) as any[]) {
    const { count } = await db
      .from("appeals")
      .select("id", { count: "exact", head: true })
      .eq("subject_type", "video")
      .eq("subject_id", v.id)
      .eq("status", "open");
    if (count) continue;
    const rm = await db.storage.from("listing-videos").remove([v.storage_path]);
    if (rm.error) {
      report.errors.push(`${v.id}: ${rm.error.message}`);
      continue;
    }
    await db.from("listing_videos").update({ storage_deleted_at: new Date().toISOString() }).eq("id", v.id);
    await log("system.video_deleted_after_30_days", v.id);
    report.deleted++;
  }

  return NextResponse.json(report);
}
