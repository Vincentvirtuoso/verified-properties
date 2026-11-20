"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { LuMic, LuMicOff, LuPhoneCall, LuPhoneOff } from "react-icons/lu";
import {
  fetchEnquiryCall,
  startEnquiryCall,
  StartCallError,
  type EnquiryCallRow,
} from "@affilhomes/shared/supabase";
import { cn } from "@/lib/utils";

const CHANNEL = process.env.NEXT_PUBLIC_AI_CALL_CHANNEL ?? "off";

const SKIP_MESSAGES: Record<string, string> = {
  email_unverified: "Verify your email to talk to the AI assistant.",
  phone_unverified:
    "Verify the phone number you used to talk to the AI assistant.",
  own_listing: "AI calls aren't available on your own listing.",
};

const ERROR_MESSAGES: Record<string, string> = {
  calls_disabled: "AI calls aren't available right now.",
  not_available: "This call can't be started.",
  listing_unavailable: "This listing isn't available for calls.",
  unauthorized: "Please sign in again.",
};

type Phase = "idle" | "connecting" | "live";

export function AiCallCard({
  enquiryId,
  onChanged,
}: {
  enquiryId: string;
  onChanged?: () => void;
}) {
  const [row, setRow] = useState<EnquiryCallRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const audioHostRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      setRow(await fetchEnquiryCall(enquiryId));
    } catch {
      /* keep the last known row */
    }
    setLoaded(true);
  }, [enquiryId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => () => void roomRef.current?.disconnect(), []);

  const finish = useCallback(() => {
    roomRef.current = null;
    setPhase("idle");
    setMuted(false);
    if (audioHostRef.current) audioHostRef.current.innerHTML = "";
    void refresh();
    onChanged?.();
  }, [refresh, onChanged]);

  const start = async () => {
    setError(null);
    setPhase("connecting");
    try {
      // Ask for the microphone first, so a refusal can't leave a half-started call.
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());

      const { url, token } = await startEnquiryCall(enquiryId);
      const room = new Room();
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          audioHostRef.current?.appendChild(track.attach());
        }
      });
      room.on(RoomEvent.ParticipantDisconnected, (p) => {
        if (p.identity.startsWith("agent")) void room.disconnect();
      });
      room.on(RoomEvent.Disconnected, finish);
      roomRef.current = room;
      await room.connect(url, token);
      await room.startAudio();
      await room.localParticipant.setMicrophoneEnabled(true);
      setPhase("live");
      void refresh();
    } catch (e) {
      roomRef.current = null;
      setPhase("idle");
      if (e instanceof StartCallError) {
        setError(
          ERROR_MESSAGES[e.code] ??
            "We couldn't start the call. Please try again.",
        );
      } else if ((e as Error)?.name === "NotAllowedError") {
        setError("Allow microphone access to talk to the assistant.");
      } else {
        setError("We couldn't start the call. Please try again.");
      }
      void refresh();
    }
  };

  const toggleMute = async () => {
    const next = !muted;
    await roomRef.current?.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  };

  if (!loaded || CHANNEL !== "browser" || !row) return null;
  if (row.status === "completed" || row.status === "failed") return null;

  let body: React.ReactNode;
  if (row.status === "skipped") {
    body = (
      <p className="text-xs text-muted">
        {SKIP_MESSAGES[row.skip_reason ?? ""] ??
          "AI calls aren't available for this enquiry."}
      </p>
    );
  } else if (phase === "live") {
    body = (
      <div className="flex items-center gap-3">
        <p className="flex-1 text-xs font-semibold text-foreground">
          On a call with the AI assistant
        </p>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground"
        >
          {muted ? (
            <LuMicOff className="h-4 w-4" />
          ) : (
            <LuMic className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => void roomRef.current?.disconnect()}
          aria-label="End call"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-white"
        >
          <LuPhoneOff className="h-4 w-4" />
        </button>
      </div>
    );
  } else if (row.status === "in_progress") {
    body = (
      <p className="text-xs text-muted">A call was started for this enquiry.</p>
    );
  } else {
    body = (
      <div className="flex items-center gap-3">
        <p className="flex-1 text-xs text-muted">
          You'll speak with an AI assistant, not the agent. It can answer
          questions about this property.
        </p>
        <button
          type="button"
          onClick={start}
          disabled={phase === "connecting"}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2",
            "text-xs font-semibold text-primary-foreground disabled:opacity-50",
          )}
        >
          <LuPhoneCall className="h-4 w-4" />
          {phase === "connecting" ? "Connecting..." : "Start AI call"}
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-border bg-card px-4 py-3">
      {body}
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <div ref={audioHostRef} className="hidden" />
    </div>
  );
}
