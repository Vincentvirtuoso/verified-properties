"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  LuSearch,
  LuX,
  LuSlidersHorizontal,
  LuArrowUpDown,
} from "react-icons/lu";
import { MOCK_COURSES } from "@/data/courses";
import CourseCard from "../components/CourseCard";
import { getBreadcrumbItems } from "../AcademyPageClient";
import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";

const TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Video", value: "video" },
  { label: "Document", value: "doc" },
  { label: "Audio", value: "audio" },
  { label: "Mixed", value: "mixed" },
] as const;

const DIFFICULTY_OPTIONS = [
  { label: "All Levels", value: "" },
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
] as const;

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const pathname = usePathname();

  const breadcrumbItems = getBreadcrumbItems(pathname);

  const filteredCourses = useMemo(() => {
    let result = [...MOCK_COURSES];

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter);
    }

    if (difficultyFilter) {
      result = result.filter((c) => c.difficulty === difficultyFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [search, typeFilter, difficultyFilter, sort]);

  const clearAllFilters = () => {
    setSearch("");
    setTypeFilter("");
    setDifficultyFilter("");
    setSort("newest");
  };

  const hasActiveFilters = search || typeFilter || difficultyFilter;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              All Courses
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore our full library of expert-led courses
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}
          >
            <LuArrowUpDown className="mr-2 h-4 w-4" />
            {sort === "newest" ? "Newest First" : "Oldest First"}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <LuX className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LuSlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />
            {TYPE_OPTIONS.map((opt) => (
              <Badge
                key={opt.value}
                variant={typeFilter === opt.value ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() =>
                  setTypeFilter(typeFilter === opt.value ? "" : opt.value)
                }
              >
                {opt.label}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <Badge
                key={opt.value}
                variant={difficultyFilter === opt.value ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() =>
                  setDifficultyFilter(
                    difficultyFilter === opt.value ? "" : opt.value,
                  )
                }
              >
                {opt.label}
              </Badge>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-muted-foreground hover:text-primary whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Showing {filteredCourses.length} of {MOCK_COURSES.length} courses
        </p>

        {filteredCourses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-foreground">
              No courses found
            </h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={clearAllFilters}
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
