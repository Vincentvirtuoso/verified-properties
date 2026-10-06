// app/companies/page.tsx
import { createClient } from "@/lib/supabase/server";
import { fetchPublicCompanies } from "@/lib/supabase/publicDirectory";
import { Company } from "@/types";
import { Metadata } from "next";
import { CompanyDirectory } from "./_components/CompanyDirectory";

// ---------- SEO Metadata ----------
export const metadata: Metadata = {
  title: "Real Estate Companies & Agencies – Find Top Professionals",
  description:
    "Browse verified real estate companies, developers, and brokers. View active listings, team info, and get in touch directly.",
  openGraph: {
    title: "Real Estate Companies & Agencies",
    description:
      "Browse verified real estate companies, developers, and brokers. View active listings, team info, and get in touch directly.",
    url: "https://yourdomain.com/companies",
    siteName: "Your Platform Name",
    images: [
      {
        url: "https://yourdomain.com/og-companies.jpg",
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
    images: ["https://yourdomain.com/og-companies.jpg"],
  },
  alternates: {
    canonical: "/companies",
  },
};

// ---------- Structured Data ----------
function CompaniesStructuredData({
  companies,
}: {
  companies: Company[]; // adjust to your type
}) {
  const itemListElement = companies.map((company, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "RealEstateAgent", // or Organization
      name: company.name,
      url: `https://yourdomain.com/companies/${company.slug}`,
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

// ---------- Server Component ----------
export default async function CompaniesPage() {
  // Verified companies, or ones with a live listing.
  const companies = await fetchPublicCompanies(await createClient()).catch(() => []);

  return (
    <>
      <CompaniesStructuredData companies={companies} />
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Real Estate Companies & Professionals
            </h1>
            <p className="mt-2 text-muted-foreground">
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
