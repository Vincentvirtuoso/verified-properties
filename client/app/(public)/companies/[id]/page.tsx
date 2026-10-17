import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@affilhomes/shared/supabase/client";
import { fetchPublicCompany } from "@affilhomes/shared/supabase";
import { CompanyClient } from "../_components/CompanyClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchPublicCompany(id, createClient()).catch(() => null);
  if (!data) return { title: "Company not found" };

  const { name, //description 
    } = data.company;
  return {
    title: `${name} – Real Estate Company`,
    description:
      // description ??
      `Browse ${name}'s property listings, agents and contact details.`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await fetchPublicCompany(id, createClient());
  if (!data) notFound();

  return (
    <CompanyClient
      company={data.company}
      agents={data.company.team}
      listings={data.listings}
    />
  );
}
