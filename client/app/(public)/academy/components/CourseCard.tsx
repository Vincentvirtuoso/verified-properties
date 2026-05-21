"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { Course } from "@/types";
import { LuBookOpen, LuVideo, LuHeadphones, LuLayers } from "react-icons/lu";

const typeIcons: Record<string, React.ReactNode> = {
  video: <LuVideo />,
  doc: <LuBookOpen />,
  audio: <LuHeadphones />,
  mixed: <LuLayers />,
};

const difficultyColors: Record<string, string> = {
  beginner:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

interface Props {
  course: Course;
  variant?: "default" | "featured";
}

export default function CourseCard({ course, variant = "default" }: Props) {
  return (
    <Link href={`/academy/courses/${course.slug}`}>
      <motion.div
        whileHover={{ scale: 0.98 }}
        className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow h-full"
      >
        <div className="h-40 bg-muted/10 flex items-center justify-center">
          <span className="text-4xl text-muted opacity-40">
            {typeIcons[course.type] ?? <LuBookOpen />}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {course.type}
            </Badge>
            <Badge className={`text-xs ${difficultyColors[course.difficulty]}`}>
              {course.difficulty}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
          <p className="mt-1 text-sm text-muted line-clamp-2">
            {course.description}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            {(course.type === "video" || course.type === "audio") && (
              <span>{course.duration || "Multiple modules"}</span>
            )}
            {course.tags.length > 0 && (
              <span>{course.tags.slice(0, 2).join(", ")}</span>
            )}
          </div>
        </div>
        {course.isFeatured && variant === "featured" && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
            Featured
          </div>
        )}
      </motion.div>
    </Link>
  );
}
