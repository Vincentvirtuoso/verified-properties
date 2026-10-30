import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClientFromServer as createServerClient } from "@affilhomes/shared/supabase/server";
import {
  fetchPublicCompany,
  fetchPublicCompanyAgents,
} from "@affilhomes/shared/supabase/publicDirectory";
import { CompanyPublicGate } from "@/components/company/CompanyPublicGate";

const loadCompany = cache(async (slug: string) => {
  const supabase = await createServerClient();
  return fetchPublicCompany(slug, supabase);
});

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadCompany(slug);
  if (!result) return { title: "Company not found" };

  const { company, listings } = result;
  return {
    title: company.name,
    description: `${company.name} on Affilhomes. ${listings.length} active ${
      listings.length === 1 ? "listing" : "listings"
    }.`,
    openGraph: company.logo ? { images: [company.logo] } : undefined,
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const result = await loadCompany(slug);
  if (!result) notFound();

  const { company, listings } = result;
  const supabase = await createServerClient();
  const agents = await fetchPublicCompanyAgents(company._id, supabase);

  return (
    <CompanyPublicGate company={company} agents={agents} listings={listings} />
  );
}
