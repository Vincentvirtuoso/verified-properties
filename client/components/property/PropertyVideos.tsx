"use client";

import { motion } from "framer-motion";
import { RiVideoLine } from "react-icons/ri";

interface PropertyVideosProps {
  videoLinks: string[];
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&/#\n]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getEmbedUrl(url: string): string {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}`;
  return url;
}

export default function PropertyVideos({ videoLinks }: PropertyVideosProps) {
  if (!videoLinks || videoLinks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <RiVideoLine size={18} className="text-violet-500" />
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Video Tour
        </h2>
      </div>

      <div className="grid gap-4">
        {videoLinks.map((link, idx) => (
          <div
            key={idx}
            className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800"
          >
            <iframe
              src={getEmbedUrl(link)}
              title={`Property video ${idx + 1}`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
