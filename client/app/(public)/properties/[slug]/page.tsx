import { notFound } from "next/navigation";
import { Metadata } from "next";
import PropertyDetailClient from "./PropertyDetailClient";
import { PopulatedProperty } from "@/types/property";
import { createClient } from "@/lib/supabase/server";
import { fetchPropertyBySlug } from "@/lib/supabase/publicProperties";

async function getProperty(slug: string): Promise<PopulatedProperty | null> {
  const supabase = await createClient();
  return fetchPropertyBySlug(slug, supabase);
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return { title: "Property Not Found" };

  return {
    title: `${property.title} | ${property.location.city}, ${property.location.state}`,
    description:
      property.description?.slice(0, 160) ??
      `${property.title} for ${property.listingPurpose} in ${property.location.city}, ${property.location.state}`,
    openGraph: {
      title: property.title,
      description: property.description?.slice(0, 160),
      images: property.image ? [{ url: property.image }] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) notFound();

  return <PropertyDetailClient property={property} />;
}
