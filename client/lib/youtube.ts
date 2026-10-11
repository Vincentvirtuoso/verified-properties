/**
 * Server-only helpers for the single Affilhomes YouTube channel.
 * Needs these environment variables (never NEXT_PUBLIC_):
 *   YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
 * The refresh token belongs to the Affilhomes Google account that owns the
 * channel (scope: https://www.googleapis.com/auth/youtube.upload and
 * https://www.googleapis.com/auth/youtube).
 */

export function youtubeConfigured(): boolean {
  return !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET && process.env.YOUTUBE_REFRESH_TOKEN);
}

async function accessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) throw new Error("YouTube sign-in failed. Check the YouTube keys.");
  return body.access_token as string;
}

/** Streams a video from a (signed) URL into a resumable YouTube upload. Returns the YouTube video id. */
export async function uploadToYouTube(opts: {
  sourceUrl: string;
  title: string;
  description: string;
  privacy: "public" | "unlisted";
}): Promise<string> {
  const token = await accessToken();
  const source = await fetch(opts.sourceUrl);
  if (!source.ok || !source.body) throw new Error("Couldn't read the video file.");
  const length = source.headers.get("content-length");
  const type = source.headers.get("content-type") || "video/*";

  const init = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json; charset=UTF-8",
        "x-upload-content-type": type,
        ...(length ? { "x-upload-content-length": length } : {}),
      },
      body: JSON.stringify({
        snippet: { title: opts.title.slice(0, 100), description: opts.description.slice(0, 4900), categoryId: "19" },
        status: { privacyStatus: opts.privacy, selfDeclaredMadeForKids: false },
      }),
    },
  );
  const location = init.headers.get("location");
  if (!init.ok || !location) {
    const err = await init.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "YouTube refused the upload.");
  }

  const put = await fetch(location, {
    method: "PUT",
    headers: { "content-type": type, ...(length ? { "content-length": length } : {}) },
    body: source.body,
    // Required by Node's fetch when streaming a request body.
    duplex: "half",
  } as RequestInit & { duplex: "half" });
  const done = await put.json().catch(() => ({}));
  if (!put.ok || !done.id) throw new Error(done?.error?.message ?? "YouTube upload failed.");
  return done.id as string;
}

export async function setYouTubePrivacy(videoId: string, privacy: "public" | "unlisted") {
  const token = await accessToken();
  const res = await fetch("https://www.googleapis.com/youtube/v3/videos?part=status", {
    method: "PUT",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ id: videoId, status: { privacyStatus: privacy } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Couldn't change the video privacy.");
  }
}
