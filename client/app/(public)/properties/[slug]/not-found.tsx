"use client";

import { useParams } from "next/navigation";
import { PropertyNotFound } from "@/components/property/PropertyNotFound";

export default function NotFound() {
  const params = useParams<{ slug: string | string[] }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  return <PropertyNotFound slug={slug} reason="not_found" />;
}
