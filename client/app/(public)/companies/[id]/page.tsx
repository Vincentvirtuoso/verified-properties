import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicCompany } from "@/lib/supabase/publicDirectory";
import CompanyClient from "../_components/CompanyClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchPublicCompany(id, await createClient()).catch(() => null);
  if (!data) return { title: "Company not found" };
  return {
    title: `${data.company.name} – Real Estate Company`,
    description: `Browse live listings from ${data.company.name} and get in touch.`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchPublicCompany(decodeURIComponent(id), await createClient());

  if (!data) notFound();

  return <CompanyClient company={data.company} listings={data.listings} />;
}
