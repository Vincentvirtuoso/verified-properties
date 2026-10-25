import { cache } from "react";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import PropertyDetailClient from "./PropertyDetailClient";
import {
  PropertyNotFound,
  type UnavailableReason,
} from "@/components/property/PropertyNotFound";
import type {
  PopulatedProperty,
  PropertyStatus,
} from "@affilhomes/shared/types/property";
import { createClient } from "@affilhomes/shared/supabase/client";
import {
  fetchPropertyBySlug,
  fetchSimilarProperties,
} from "@affilhomes/shared/supabase";

/**
 * ISR: page HTML re-renders at most every 60s.
 * The DB query is cached with a tag so admins can purge it via
 * `revalidateTag("properties")`.
 */
export const revalidate = 60;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://verified-properties.com.ng";

type UnavailableStatus = Exclude<PropertyStatus, "draft" | "active">;

const isUnavailable = (status: PropertyStatus): status is UnavailableStatus =>
  status === "sold" || status === "rented" || status === "inactive";

const getProperty = cache(
  unstable_cache(
    async (slug: string): Promise<PopulatedProperty | null> => {
      // Cookieless client: unstable_cache can't read request cookies.
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

  if (!property || property.status === "draft") {
    return {
      title: "Property not found",
      robots: { index: false, follow: false },
    };
  }

  const location = `${property.location.city}, ${property.location.state}`;
  const title = `${property.title} | ${location}`;

  // Unavailable listings stay out of search results but keep their links followable.
  if (!isUnavailable(property.status) && property.status !== "active") {
    return { title, robots: { index: false, follow: false } };
  }
  if (isUnavailable(property.status)) {
    return { title, robots: { index: false, follow: true } };
  }

  const purpose = property.listingPurpose === "rent" ? "for rent" : "for sale";
  const canonicalPath = `/properties/${property.slug}`;
  const description =
    property.description?.slice(0, 160) ??
    `${property.title} ${purpose} in ${location}`;

  return {
    title,
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

  // Missing, or still pending review: not public.
  if (!property) notFound();

  if (property.status === "active") {
    return <PropertyDetailClient property={property} />;
  }

  // Draft and any unexpected status: not public.
  if (!isUnavailable(property.status)) notFound();

  // sold | rented | inactive
  const similarProperties = await fetchSimilarProperties({
    category: property.category,
    city: property.location.city,
    excludeId: property._id,
  });

  return (
    <PropertyNotFound
      slug={slug}
      reason={property.status as UnavailableReason}
      similarProperties={similarProperties}
    />
  );
}
