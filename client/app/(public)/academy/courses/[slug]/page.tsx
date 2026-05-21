"use client";

import { useParams, notFound, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  LuBookOpen,
  LuVideo,
  LuHeadphones,
  LuLayers,
  LuClock,
  LuShare2,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";
import { useState } from "react";
import { MOCK_COURSES } from "@/data/courses";
import { Course, CourseContentBlock } from "@/types/course";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { getBreadcrumbItems } from "../../page";

const typeIcons: Record<string, React.ReactNode> = {
  video: <LuVideo className="h-4 w-4" />,
  doc: <LuBookOpen className="h-4 w-4" />,
  audio: <LuHeadphones className="h-4 w-4" />,
  mixed: <LuLayers className="h-4 w-4" />,
};

const difficultyColors: Record<string, string> = {
  beginner:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const course = MOCK_COURSES.find((c) => c.slug === slug);

  const pathname = usePathname();
  if (!course) return notFound();

  const breadcrumbItems = getBreadcrumbItems(pathname, course.title);

  return (
    <main className="bg-background">
      <div className="px-4 py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <span className="flex items-center gap-1">
                {typeIcons[course.type]}
                {course.type}
              </span>
            </Badge>
            <Badge className={`text-xs ${difficultyColors[course.difficulty]}`}>
              {course.difficulty}
            </Badge>
            {(course.type === "video" || course.type === "audio") && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <LuClock className="h-3 w-3" />
                {course.duration}
              </span>
            )}
            {course.isFeatured && (
              <Badge className="text-xs bg-primary text-primary-foreground">
                Featured
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {course.title}
          </h1>

          <p className="text-muted-foreground leading-relaxed">
            {course.description}
          </p>

          {course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs rounded-full bg-muted/20 text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10">
          {course.type === "video" && (
            <VideoContent youtubeUrl={course.youtubeUrl} />
          )}
          {course.type === "doc" && <DocContent content={course.content} />}
          {course.type === "audio" && (
            <AudioContent
              audioUrl={course.audioUrl}
              transcript={course.transcript}
            />
          )}
          {course.type === "mixed" && <MixedContent course={course} />}
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <Button variant="outline" size="sm">
            <LuShare2 className="mr-2 h-4 w-4" />
            Share Course
          </Button>
        </div>
      </div>
    </main>
  );
}

function VideoContent({ youtubeUrl }: { youtubeUrl: string }) {
  const videoId = youtubeUrl.includes("watch?v=")
    ? youtubeUrl.split("v=")[1]?.split("&")[0]
    : youtubeUrl.split("/").pop();
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={embedUrl}
        title="Course video"
        allowFullScreen
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}

function DocContent({ content }: { content: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 md:p-8 prose prose-neutral dark:prose-invert max-w-none">
      <p className="whitespace-pre-wrap text-foreground leading-relaxed">
        {content}
      </p>
    </div>
  );
}

function AudioContent({
  audioUrl,
  transcript,
}: {
  audioUrl: string;
  transcript?: string;
}) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <audio controls className="w-full">
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>

      {transcript && (
        <div>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {showTranscript ? <LuChevronUp /> : <LuChevronDown />}
            {showTranscript ? "Hide Transcript" : "Show Transcript"}
          </button>
          {showTranscript && (
            <div className="mt-3 p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MixedContent({ course }: { course: Course }) {
  const modules = course.type === "mixed" ? course.modules || [] : [];
  return (
    <div className="space-y-4">
      {modules.map((module: CourseContentBlock, idx: number) => (
        <ModuleAccordion key={idx} module={module} index={idx} />
      ))}
    </div>
  );
}

function ModuleAccordion({
  module,
  index,
}: {
  module: CourseContentBlock;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const icon =
    module.type === "video" ? (
      <LuVideo className="h-4 w-4" />
    ) : module.type === "doc" ? (
      <LuBookOpen className="h-4 w-4" />
    ) : (
      <LuHeadphones className="h-4 w-4" />
    );

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-card hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">{icon}</span>
          <span className="font-medium text-foreground">
            {index + 1}. {module.title}
          </span>
          {(module.type === "video" || module.type === "audio") && (
            <span className="text-xs text-muted-foreground">
              {module.duration}
            </span>
          )}
        </div>
        {isOpen ? (
          <LuChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <LuChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2">
          {module.type === "video" && (
            <VideoContent youtubeUrl={module.youtubeUrl} />
          )}
          {module.type === "doc" && <DocContent content={module.content} />}
          {module.type === "audio" && (
            <AudioContent
              audioUrl={module.audioUrl}
              transcript={module.transcript}
            />
          )}
        </div>
      )}
    </div>
  );
}
