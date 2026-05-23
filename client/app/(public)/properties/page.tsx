import { Suspense } from "react";
import { Metadata } from "next";
import PropertiesContent from "./PropertiesContent";
import { PageSpinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Verified Real Estate Listings | Find Your Next Property",
  description:
    "Browse our curated selection of verified properties for sale and rent. Explore high-quality photos, detailed descriptions, and transparent pricing.",
  keywords: [
    "real estate",
    "properties for sale",
    "apartments for rent",
    "verified listings",
    "buy house",
  ],
  openGraph: {
    title: "Verified Real Estate Listings | Find Your Next Property",
    description:
      "Browse our curated selection of verified properties for sale and rent.",
    url: "https://yourwebsite.com/properties",
    siteName: "Verified Properties",
    type: "website",
    images: [
      {
        url: "https://yourwebsite.com/og-properties.jpg",
        width: 1200,
        height: 630,
        alt: "Browse Properties",
      },
    ],
  },
  alternates: {
    canonical: "https://yourwebsite.com/properties",
  },
};

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={<PageSpinner label="Loading properties page content..." />}
    >
      <PropertiesContent />
    </Suspense>
  );
}
