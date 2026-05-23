import { Metadata } from "next";
import SupportClient from "./SupportClient";

export const metadata: Metadata = {
  title: "Support Center & Help FAQs | Verified Properties",
  description:
    "Get immediate help, browse answered frequently asked questions, or get in touch directly with our real estate support specialists.",
  keywords: [
    "customer support",
    "real estate help",
    "FAQs",
    "contact agent",
    "property help desk",
  ],
  openGraph: {
    title: "Support Center & Help FAQs | Verified Properties",
    description:
      "Get immediate help, browse answered FAQs, or contact our support team.",
    url: "https://yourwebsite.com/support",
    siteName: "Verified Properties",
    type: "website",
  },
  alternates: {
    canonical: "https://yourwebsite.com/support",
  },
};

export default function SupportPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Support Center",
    description: "Get help, browse FAQs, or contact our support team.",
    provider: {
      "@type": "RealEstateAgent",
      name: "Verified Properties",
      url: "https://yourwebsite.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SupportClient />
    </>
  );
}
