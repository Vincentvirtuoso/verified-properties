import { Metadata } from "next";
import { MOCK_COURSES, MOCK_PODCASTS } from "@/data/courses";
import AcademyPageClient from "./AcademyPageClient";

const TITLE = "Courses, AI Calling & Property Documents | Academy";
const DESCRIPTION =
  "Expert-led courses, podcasts, and guides on AI calling for property enquiries and on the documents behind every listing, including C of O, Governor's Consent, and survey plans.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "online courses",
    "property academy",
    "AI calling",
    "AI voice agents for real estate",
    "C of O Nigeria",
    "Governor's Consent",
    "survey plan",
    "property documents",
    "land title documents Nigeria",
    "professional training",
    "podcasts",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/academy`,
    siteName: "Your Brand Academy",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/og-academy.jpg`,
        width: 1200,
        height: 630,
        alt: "Academy: courses, AI calling, and property documents",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${process.env.NEXT_PUBLIC_CLIENT_URL}/og-academy.jpg`],
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_CLIENT_URL}/academy`,
  },
};

export default function AcademyPage() {
  return <AcademyPageClient courses={MOCK_COURSES} podcasts={MOCK_PODCASTS} />;
}
