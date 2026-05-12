import { notFound } from "next/navigation";
import { Metadata } from "next";
import PropertyDetailClient from "./PropertyDetailClient";
import { Property } from "@/types/property";
import { properties } from "@/data/properties";

async function getProperty(slug: string): Promise<Property | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const property = properties.find(
    (p) => p.slug.toLowerCase() === slug.toLowerCase(),
  );
  return property || null;
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
    title: `${property.title} | ${property.location}`,
    description:
      property.description?.slice(0, 160) ??
      `${property.title} for ${property.listingType} in ${property.location}`,
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
