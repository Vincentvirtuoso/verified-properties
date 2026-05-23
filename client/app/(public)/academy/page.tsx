import { Metadata } from "next";
import { MOCK_COURSES, MOCK_PODCASTS } from "@/data/courses";
import AcademyPageClient from "./AcademyPageClient";

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
    url: "https://yourwebsite.com/academy",
    siteName: "Your Brand Academy",
    images: [
      {
        url: "https://yourwebsite.com/og-academy.jpg",
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

export default function AcademyPage() {
  return <AcademyPageClient courses={MOCK_COURSES} podcasts={MOCK_PODCASTS} />;
}