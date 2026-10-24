"use client";

import { useParams } from "next/navigation";
import { PropertyNotFound } from "@/components/property/PropertyNotFound";

export default function NotFound() {
  const params = useParams<{ slug: string }>();
  return <PropertyNotFound slug={params?.slug ?? ""} />;
}
