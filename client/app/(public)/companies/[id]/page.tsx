import { notFound } from "next/navigation";
import { properties } from "@/data/properties";
import CompanyClient from "../_components/CompanyClient";
import { mockCompanies } from "@/data/companies";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = mockCompanies.find((c) => c._id === id);

  if (!company) notFound();

  const listings = properties.filter(
    (p) => p.ownerId?.companyId?._id === id && p.ownerType === "company",
  );

  return <CompanyClient company={company} listings={listings} />;
}
