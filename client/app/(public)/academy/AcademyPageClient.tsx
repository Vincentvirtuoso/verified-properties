"use client";

import HeroSection from "./components/HeroSection";
import FeaturedCoursesCarousel from "./components/FeaturedCoursesCarousel";
import CoursesGrid from "./components/CoursesGrid";
import PodcastSection from "./components/PodcastSection";
import CategoriesSection from "./components/CategoriesSection";
import LearningStatsSection from "./components/LearningStatsSection";
import CtaSection from "./components/CtaSection";
import { LuFolderOpen, LuFolders, LuGraduationCap } from "react-icons/lu";
import { BreadcrumbItem } from "@/components/common/BreadCrumbs";

interface Course {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

interface Podcast {
  [key: string]: unknown;
}

interface AcademyPageClientProps {
  courses: Course[];
  podcasts: Podcast[];
}

export const getBreadcrumbItems = (pathname: string, courseTitle?: string) => {
  const items: BreadcrumbItem[] = [
    { label: "Academy", href: "/academy", icon: <LuGraduationCap /> },
  ];

  if (pathname.includes("/academy/courses")) {
    items.push({
      label: "Courses",
      href: "/academy/courses",
      icon: <LuFolders />,
    });
  }

  if (pathname.includes("/academy/courses/") && courseTitle) {
    items.push({
      label: courseTitle,
      href: pathname,
      icon: <LuFolderOpen />,
    });
  }

  return items;
};

export default function AcademyPageClient({ courses, podcasts }: AcademyPageClientProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: courses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: course.title || "Course Title",
        description: course.description || "Course description details.",
        provider: {
          "@type": "Organization",
          name: "Your Brand Academy",
          sameAs: "https://verified-properties.com",
        },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <FeaturedCoursesCarousel courses={courses} />
      <LearningStatsSection />
      <CategoriesSection />
      <CoursesGrid courses={courses} title="Explore All Courses" />
      <PodcastSection podcasts={podcasts} />
      <CtaSection />
    </div>
  );
}