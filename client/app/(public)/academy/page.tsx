import { Metadata } from "next";
import HeroSection from "./components/HeroSection";
import FeaturedCoursesCarousel from "./components/FeaturedCoursesCarousel";
import CoursesGrid from "./components/CoursesGrid";
import PodcastSection from "./components/PodcastSection";
import CategoriesSection from "./components/CategoriesSection";
import LearningStatsSection from "./components/LearningStatsSection";
import CtaSection from "./components/CtaSection";
import { LuFolderOpen, LuFolders, LuGraduationCap } from "react-icons/lu";
import { BreadcrumbItem } from "@/components/common/BreadCrumbs";
import { MOCK_COURSES, MOCK_PODCASTS } from "@/data/courses";

// 1. Static SEO Metadata API (Generates Head tags on the Server)
export const metadata: Metadata = {
  title: "Online Courses & Professional Certifications | Academy",
  description:
    "Browse our comprehensive catalog of expert-led courses, video tutorials, and industry podcasts. Start learning and upgrading your skillset today.",
  keywords: [
    "online courses",
    "e-learning",
    "professional training",
    "academy tutorials",
    "podcasts",
  ],
  openGraph: {
    title: "Online Courses & Professional Certifications | Academy",
    description:
      "Browse our comprehensive catalog of expert-led courses, video tutorials, and industry podcasts.",
    url: "https://yourwebsite.com/academy", // Replace with your actual domain
    siteName: "Your Brand Academy",
    images: [
      {
        url: "https://yourwebsite.com/og-academy.jpg", // Replace with your standard social share image
        width: 1200,
        height: 630,
        alt: "Academy Learning Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Courses & Professional Certifications | Academy",
    description:
      "Browse our comprehensive catalog of expert-led courses, video tutorials, and industry podcasts.",
    images: ["https://yourwebsite.com/og-academy.jpg"],
  },
  alternates: {
    canonical: "https://yourwebsite.com/academy",
  },
};

// Kept your helper function intact for external layout/component use
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: MOCK_COURSES.map((course, index) => ({
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
      <FeaturedCoursesCarousel courses={MOCK_COURSES} />
      <LearningStatsSection />
      <CategoriesSection />
      <CoursesGrid courses={MOCK_COURSES} title="Explore All Courses" />
      <PodcastSection podcasts={MOCK_PODCASTS} />
      <CtaSection />
    </div>
  );
}
