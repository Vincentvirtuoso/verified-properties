import { Suspense } from "react";
import { Metadata } from "next";
import { PropertiesPage } from "@/components/propertiesList/PropertiesPage";
import { PropertiesPageSkeleton } from "@/components/propertiesList/PropertiesPageSkeleton";

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
    url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/properties`,
    siteName: "Verified Properties",
    type: "website",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/og-properties.jpg`,
        width: 1200,
        height: 630,
        alt: "Browse Properties",
      },
    ],
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_CLIENT_URL}/properties`,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<PropertiesPageSkeleton />}>
      <PropertiesPage />
    </Suspense>
  );
}