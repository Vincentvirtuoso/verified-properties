"use client";

import HeroSection from "./components/HeroSection";
import FeaturedCoursesCarousel from "./components/FeaturedCoursesCarousel";
import CoursesGrid from "./components/CoursesGrid";
import PodcastSection from "./components/PodcastSection";
import CategoriesSection from "./components/CategoriesSection";
import LearningStatsSection from "./components/LearningStatsSection";
import { MOCK_COURSES, MOCK_PODCASTS } from "@/data/courses";
import CtaSection from "./components/CtaSection";
import { LuFolderOpen, LuFolders, LuGraduationCap } from "react-icons/lu";
import { BreadcrumbItem, Breadcrumbs } from "@/components/common/BreadCrumbs";
import { usePathname } from "next/dist/client/components/navigation";

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

export default function AcademyPage() {
  const pathname = usePathname();
  const breadcrumbItems = getBreadcrumbItems(pathname);
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Breadcrumbs items={breadcrumbItems} className="mx-4" />
      <HeroSection />
      <FeaturedCoursesCarousel courses={MOCK_COURSES} />
      <LearningStatsSection />
      <CategoriesSection />
      <CoursesGrid courses={MOCK_COURSES} title="Explore All Courses" />
      <PodcastSection podcasts={MOCK_PODCASTS} />
      <CtaSection />
    </div>
  );
}
