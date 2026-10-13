import { cache } from "react";
import type { Metadata } from "next";
import PropertyDetailClient from "./PropertyDetailClient";
import { PropertyNotFound } from "@/components/property/PropertyNotFound";
import type { PopulatedProperty } from "@affilhomes/shared/types/property";
import { createClient } from "@affilhomes/shared/supabase/client";
import { fetchPropertyBySlug } from "@affilhomes/shared/supabase";
import { properties as mockProperties } from "@/data/properties";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://verified-properties.com.ng";

function findMockProperty(slug: string): PopulatedProperty | null {
  return (
    (mockProperties as PopulatedProperty[]).find((p) => p.slug === slug) ?? null
  );
}

const getProperty = cache(
  async (slug: string): Promise<PopulatedProperty | null> => {
    try {
      const supabase = await createClient();
      const dbProperty = await fetchPropertyBySlug(slug, supabase);
      if (dbProperty) return dbProperty;
    } catch (err) {
      console.error(`[property:${slug}] DB fetch failed, using mock:`, err);
    }

    return findMockProperty(slug);
  },
);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) {
    return {
      title: "Property not found",
      description:
        "The listing you're looking for doesn't exist or has been removed.",
      robots: { index: false, follow: false },
    };
  }

  const location = `${property.location.city}, ${property.location.state}`;
  const canonicalPath = `/properties/${property.slug ?? slug}`;
  const description =
    property.description?.slice(0, 160) ??
    `${property.title} for ${property.listingPurpose} in ${location}`;

  return {
    title: `${property.title} | ${location}`,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: property.title,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      type: "website",
      images: property.image
        ? [{ url: property.image, alt: property.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description,
      images: property.image ? [property.image] : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) return <PropertyNotFound slug={slug} />;

  return <PropertyDetailClient property={property} />;
}
