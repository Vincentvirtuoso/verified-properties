"use client";

import { useState } from "react";
import {
  documentLink,
  fetchAdminVideos,
  postVideoToYouTube,
  reviewVideo,
  type AdminVideo,
} from "@affilhomes/shared/supabase/admin";
import { Button } from "@affilhomes/shared/ui/Button";
import { Empty, FilterChips, ReviewActions, StatusPill } from "@/components/ui/ReviewActions";
import { useAdminList } from "@/hooks/useAdminList";

type Filter = "pending" | "approved" | "changes_requested" | "rejected";

export function VideosTab() {
  const [filter, setFilter] = useState<Filter>("pending");
  const { rows, error, reload } = useAdminList<AdminVideo>(
    () => fetchAdminVideos(filter),
    [filter],
  );
  const [preview, setPreview] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const watch = async (v: AdminVideo) => {
    try {
      const url = await documentLink(v.storagePath, "listing-videos");
      setPreview((p) => ({ ...p, [v.id]: url }));
    } catch {
      window.alert("Couldn't open that video.");
    }
  };

  const post = async (id: string) => {
    setPosting(id);
    setNotice(null);
    const res = await postVideoToYouTube(id);
    setNotice(res.message);
    setPosting(null);
    reload();
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground">
        All videos go to the one Affilhomes YouTube channel, so check each one
        carefully. Only videos for approved, live listings from verified owners
        can be approved. Sold or withdrawn listings switch to unlisted
        automatically, and rejected videos are deleted after 30 days unless
        there is an open appeal.
      </div>
      <FilterChips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "pending", label: "Waiting for review" },
          { value: "approved", label: "Approved" },
          { value: "changes_requested", label: "Changes requested" },
          { value: "rejected", label: "Rejected" },
        ]}
      />
      {notice && <p className="text-sm text-foreground">{notice}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!rows ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-3">
          {rows.map((v) => (
            <li
              key={v.id}
              className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {v.propertyTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v.ownerName} · owner{" "}
                    {v.ownerVerified ? "verified" : "not verified"} · listing{" "}
                    {v.propertyStatus}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v.fileName ?? "video"}
                    {v.sizeBytes
                      ? ` · ${(v.sizeBytes / 1024 / 1024).toFixed(1)} MB`
                      : ""}
                  </p>
                  {v.reviewNote && (
                    <p className="text-xs text-muted-foreground">
                      Note: {v.reviewNote}
                    </p>
                  )}
                  {v.youtubeVideoId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${v.youtubeVideoId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      On YouTube ({v.youtubePrivacy})
                    </a>
                  )}
                  {v.youtubeError && (
                    <p className="text-xs text-destructive">
                      YouTube: {v.youtubeError}
                    </p>
                  )}
                  {v.storageDeletedAt && (
                    <p className="text-xs text-muted-foreground">
                      File deleted
                    </p>
                  )}
                </div>
                <StatusPill>{v.status.replace("_", " ")}</StatusPill>
                {!v.storageDeletedAt && !preview[v.id] && (
                  <Button size="sm" variant="outline" onClick={() => watch(v)}>
                    Watch
                  </Button>
                )}
                {v.status === "approved" && !v.youtubeVideoId && (
                  <Button
                    size="sm"
                    isLoading={posting === v.id}
                    onClick={() => post(v.id)}
                  >
                    Post to YouTube
                  </Button>
                )}
              </div>
              {preview[v.id] && (
                <video
                  src={preview[v.id]}
                  controls
                  className="w-full rounded-xl bg-muted"
                />
              )}
              {v.status === "pending" && (
                <ReviewActions
                  labels={{ more_info: "Request changes" }}
                  onDecide={async (d, reason) => {
                    await reviewVideo(v.id, d, reason);
                    if (d === "approve") await post(v.id);
                    else reload();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
