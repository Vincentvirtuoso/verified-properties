"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { LuPlay, LuPause, LuClock, LuMic } from "react-icons/lu";
import Image from "next/image";
import { imageLoader } from "@/utils/helpers";
import type { Podcast } from "@/types/podcast";

interface Props {
  podcast: Podcast;
  onClose: () => void;
}

export default function PodcastDetailModal({ podcast, onClose }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <Modal open={true} onClose={onClose} className="p-6">
      <div className="relative h-40 mx-auto rounded-2xl overflow-hidden shadow-lg mb-6">
        <Image
          src={podcast.thumbnail || "/placeholder-podcast.png"}
          alt={podcast.title}
          fill
          className="object-cover"
          loader={imageLoader}
          sizes="160px"
        />
      </div>

      <div className="text-center mb-6">
        <p className="text-xs text-muted uppercase tracking-wider">
          Episode {podcast.episode}
        </p>
        <h2 className="text-xl font-bold text-foreground mt-1">
          {podcast.title}
        </h2>
        <div className="flex items-center justify-center gap-3 mt-2 text-sm text-muted">
          <span className="flex items-center gap-1">
            <LuMic className="w-4 h-4" />
            {podcast.host}
          </span>
          <span className="flex items-center gap-1">
            <LuClock className="w-4 h-4" />
            {podcast.duration}
          </span>
        </div>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 mb-6">
        <audio
          ref={audioRef}
          src={podcast.audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? (
              <LuPause className="w-5 h-5" />
            ) : (
              <LuPlay className="w-5 h-5 ml-0.5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              Now Playing
            </div>
            <div className="text-xs text-muted truncate">{podcast.title}</div>
          </div>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <h3 className="text-base font-semibold">About this episode</h3>
        <p className="text-muted leading-relaxed">{podcast.description}</p>
      </div>
    </Modal>
  );
}
