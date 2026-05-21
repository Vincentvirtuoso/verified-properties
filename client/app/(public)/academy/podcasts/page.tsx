"use client";

import { useState } from "react";
import { LuPlay, LuClock, LuMic } from "react-icons/lu";
import Image from "next/image";
import { imageLoader } from "@/utils/helpers";
import type { Podcast } from "@/types/podcast";
import { MOCK_PODCASTS } from "@/data/courses";
import PodcastDetailModal from "../components/PodcastDetailModal";

export default function PodcastsPage() {
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Podcasts
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Expert conversations on real estate, joint ventures, and market
            trends. Tap any episode to listen.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_PODCASTS.map((podcast) => (
            <button
              key={podcast.id}
              onClick={() => setSelectedPodcast(podcast)}
              className="group text-left bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <div className="relative h-40 bg-muted flex items-center justify-center overflow-hidden">
                <Image
                  src={podcast.thumbnail || "/placeholder-podcast.png"}
                  alt={podcast.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  loader={imageLoader}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <LuPlay className="w-6 h-6 text-primary ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <LuClock className="w-3 h-3" />
                  <span>{podcast.duration}</span>
                  <span className="mx-1">•</span>
                  <span>Ep. {podcast.episode}</span>
                </div>
                <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                  {podcast.title}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-auto">
                  <LuMic className="w-3 h-3" />
                  {podcast.host}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedPodcast && (
        <PodcastDetailModal
          podcast={selectedPodcast}
          onClose={() => setSelectedPodcast(null)}
        />
      )}
    </main>
  );
}
