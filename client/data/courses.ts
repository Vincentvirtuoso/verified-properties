// @/lib/mock-courses.ts
import { Course } from "@/types/course"; // Adjust import to your path

export const MOCK_COURSES: Course[] = [
  {
    id: "c-001",
    type: "video",
    title: "Real Estate Investment 101",
    description:
      "Learn the fundamentals of Nigerian real estate, from C of O to property valuation.",
    youtubeUrl: "https://youtube.com/watch?v=example",
    duration: "45 mins",
    status: "published",
    difficulty: "beginner",
    tags: ["Real Estate", "Investment"],
    isFeatured: true,
    createdAt: "2026-05-01",
    updatedAt: "2026-05-20",
  },
  {
    id: "c-002",
    type: "mixed",
    title: "Advanced Property Development Masterclass",
    description:
      "A comprehensive guide to managing JV projects and industrial parks.",
    modules: [
      {
        type: "video",
        title: "Site Analysis",
        youtubeUrl: "https://youtube.com/watch?v=v1",
        duration: "15 mins",
      },
      {
        type: "doc",
        title: "JV Legal Frameworks",
        content: "Key clauses for JVs in Nigeria...",
      },
    ],
    status: "published",
    difficulty: "advanced",
    tags: ["Development", "JV", "Industrial"],
    isFeatured: false,
    createdAt: "2026-04-10",
    updatedAt: "2026-05-20",
  },
];
