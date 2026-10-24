import { cache } from "react";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import PropertyDetailClient from "./PropertyDetailClient";
import type { PopulatedProperty } from "@affilhomes/shared/types/property";
import { createClient } from "@affilhomes/shared/supabase/client";
import { fetchPropertyBySlug } from "@affilhomes/shared/supabase";

/**
 * ISR: page HTML re-renders at most every 60s.
 * The DB query below is separately cached with a tag so admins can
 * purge it instantly via `revalidateTag("properties")`.
 */
export const revalidate = 60;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://verified-properties.com.ng";

  const getProperty = cache(
  unstable_cache(
    async (slug: string): Promise<PopulatedProperty | null> => {
      const supabase = await createClient();
      return fetchPropertyBySlug(slug, supabase);
    },
    ["property-by-slug"],
    { revalidate: 60, tags: ["properties"] },
  ),
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

  if (!property) notFound();

  return <PropertyDetailClient property={property} />;
}
