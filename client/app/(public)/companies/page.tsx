import { createClient } from "@affilhomes/shared/supabase/client";
import { fetchPublicCompanies } from "@affilhomes/shared/supabase";
import { Company } from "@affilhomes/shared/types";
import { Metadata } from "next";
import { CompanyDirectory } from "@/components/company/CompanyDirectory";

export const metadata: Metadata = {
  title: "Real Estate Companies & Agencies â€“ Find Top Professionals",
  description:
    "Browse verified real estate companies, developers, and brokers. View active listings, team info, and get in touch directly.",
  openGraph: {
    title: "Real Estate Companies & Agencies",
    description:
      "Browse verified real estate companies, developers, and brokers. View active listings, team info, and get in touch directly.",
    url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/companies`,
    siteName: "Your Platform Name",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/og-companies.jpg`,
        width: 1200,
        height: 630,
        alt: "Real Estate Companies Directory",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate Companies & Agencies",
    description:
      "Browse verified real estate companies, developers, and brokers.",
    images: [`${process.env.NEXT_PUBLIC_CLIENT_URL}/og-companies.jpg`],
  },
  alternates: {
    canonical: "/companies",
  },
};

function CompaniesStructuredData({ companies }: { companies: Company[] }) {
  const itemListElement = companies.map((company, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "RealEstateAgent",
      name: company.name,
      url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/companies/${company.slug}`,
      logo: company.logo,
      contactPoint: {
        "@type": "ContactPoint",
        email: company.contactEmail,
        telephone: company.contactPhone,
        contactType: "customer service",
      },
    },
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function CompaniesPage() {
  const companies = await fetchPublicCompanies(createClient()).catch(() => []);

  return (
    <>
      <CompaniesStructuredData companies={companies} />
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Real Estate Companies & Professionals
            </h1>
            <p className="mt-2 text-muted">
              Browse verified agencies, developers, and brokers. Find the right
              partner for your next property.
            </p>
          </div>

          <CompanyDirectory initialCompanies={companies} />
        </div>
      </div>
    </>
  );
}
