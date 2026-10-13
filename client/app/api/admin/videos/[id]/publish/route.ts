import { NextResponse } from "next/server";
import { createClient } from "@affilhomes/shared/supabase/client";
import { uploadToYouTube, youtubeConfigured } from "@/lib/youtube";

/**
 * POST /api/admin/videos/:id/publish — post an approved video to the
 * Affilhomes YouTube channel. Runs with the admin's own session; the
 * database re-checks the admin role on every call.
 */
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: admin } = await supabase.rpc("is_admin");
  if (admin !== true)
    return NextResponse.json({ error: "Admins only" }, { status: 403 });

  if (!youtubeConfigured()) {
    return NextResponse.json(
      {
        message:
          "Approved. It will be posted once the Affilhomes YouTube account is connected.",
      },
      { status: 202 },
    );
  }

  const { data: rows, error } = await supabase.rpc("admin_list_videos", {
    _status: "approved",
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const video = (rows ?? []).find((r: any) => r.id === id);
  if (!video)
    return NextResponse.json(
      { error: "Video not found or not approved" },
      { status: 404 },
    );
  if (video.youtube_video_id)
    return NextResponse.json({ message: "Already on YouTube" });

  const signed = await supabase.storage
    .from("listing-videos")
    .createSignedUrl(video.storage_path, 3600);
  if (signed.error)
    return NextResponse.json(
      { error: "Couldn't read the video file" },
      { status: 400 },
    );

  const privacy =
    video.youtube_desired_privacy === "unlisted" ? "unlisted" : "public";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  try {
    const youtubeId = await uploadToYouTube({
      sourceUrl: signed.data.signedUrl,
      title: video.property_title,
      description: `${video.property_title}\n\nView this verified property on Affilhomes: ${site}/properties/${video.property_slug}`,
      privacy,
    });
    const mark = await supabase.rpc("admin_mark_video_posted", {
      _id: id,
      _youtube_video_id: youtubeId,
      _privacy: privacy,
    });
    if (mark.error) throw mark.error;
    return NextResponse.json({
      message: "Posted to the Affilhomes YouTube channel.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "YouTube upload failed";
    await supabase.rpc("admin_mark_video_error", { _id: id, _error: message });
    return NextResponse.json(
      { error: `Approved, but posting failed: ${message}` },
      { status: 502 },
    );
  }
}
