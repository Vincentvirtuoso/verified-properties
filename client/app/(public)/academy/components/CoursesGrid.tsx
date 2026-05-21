"use client";
import CourseCard from "./CourseCard";
import type { Course } from "@/types/course";

interface Props {
  courses: Course[];
  title?: string;
}

export default function CoursesGrid({ courses, title }: Props) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {title && <h2 className="text-3xl font-bold mb-8">{title}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
