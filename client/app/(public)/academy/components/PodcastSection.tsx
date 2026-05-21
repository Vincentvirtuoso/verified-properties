"use client";
import { motion } from "framer-motion";
import { LuPlay, LuClock } from "react-icons/lu";

interface Podcast {
  id: string;
  title: string;
  host: string;
  duration: string;
  description: string;
  thumbnail?: string;
}

interface Props {
  podcasts: Podcast[];
}

export default function PodcastSection({ podcasts }: Props) {
  return (
    <section id="podcasts" className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold mb-8">Latest Podcasts</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {podcasts.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row gap-4">
            <div className="h-40 w-40 bg-muted/30 rounded-xl shrink-0 flex items-center justify-center">
              <LuPlay className="h-10 w-10 text-muted" />
            </div>
            <div>
              <span className="text-xs text-primary font-semibold uppercase">
                Featured Episode
              </span>
              <h3 className="mt-1 text-xl font-bold">{podcasts[0].title}</h3>
              <p className="text-sm text-muted mt-1">with {podcasts[0].host}</p>
              <p className="text-sm text-subtle mt-2 line-clamp-2">
                {podcasts[0].description}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                <LuClock className="h-3 w-3" />
                {podcasts[0].duration}
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {podcasts.slice(1).map((ep) => (
            <motion.div
              key={ep.id}
              whileHover={{ scale: 1.015 }}
              className="flex gap-4 p-4 bg-card border border-border rounded-xl cursor-pointer"
            >
              <div className="h-16 w-16 bg-muted/30 rounded-lg shrink-0 flex items-center justify-center">
                <LuPlay className="h-6 w-6 text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium line-clamp-2">{ep.title}</h4>
                <p className="text-xs text-muted">
                  {ep.host} · {ep.duration}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
