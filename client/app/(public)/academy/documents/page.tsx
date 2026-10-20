import type { Metadata } from "next";
import type { PropertyDocumentType } from "@affilhomes/shared/types";
import { DOCUMENT_GUIDES } from "@/utils/guides";
import {
  DocumentLibrary,
  type DocumentGroup,
} from "@/components/academy/DocumentLibrary";

const SITE_URL = "https://yourwebsite.com";
const DOCS_PATH = "/academy/documents";

const CATEGORIES: {
  id: string;
  label: string;
  types: PropertyDocumentType[];
}[] = [
  {
    id: "title",
    label: "Title documents",
    types: [
      "certificateOfOccupancy",
      "certificateOfStatutoryRightOfOccupancy",
      "governorsConsent",
      "gazette",
    ],
  },
  {
    id: "transfers",
    label: "Transfer deeds",
    types: [
      "deedOfAssignment",
      "deedOfConveyance",
      "deedOfGift",
      "deedOfSurrender",
      "deedOfSublease",
      "deedOfLease",
      "deedOfMortgage",
    ],
  },
  {
    id: "survey",
    label: "Survey and plans",
    types: ["surveyPlan", "registeredSurveyPlan", "approvedBuildingPlan"],
  },
  {
    id: "acquisition",
    label: "Acquisition and release",
    types: ["excisionDocument", "letterOfAllocation"],
  },
  {
    id: "transactions",
    label: "Transaction documents",
    types: [
      "contractOfSale",
      "landPurchaseAgreement",
      "receiptOfPaymentForLand",
    ],
  },
  {
    id: "authority",
    label: "Authority documents",
    types: ["powerOfAttorney", "irrevocablePowerOfAttorney"],
  },
  {
    id: "supporting",
    label: "Supporting documents",
    types: [
      "taxClearanceCertificate",
      "affidavitOfLoss",
      "probateLetterOfAdministration",
    ],
  },
];

function buildGroups(): DocumentGroup[] {
  const groups: DocumentGroup[] = [];

  for (const cat of CATEGORIES) {
    const items = cat.types
      .map((type) => {
        const guide = DOCUMENT_GUIDES[type];
        if (!guide) return null;
        return {
          type,
          name: guide.name,
          summary: guide.summary,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (items.length > 0) {
      groups.push({ id: cat.id, label: cat.label, items });
    }
  }

  const categorized = new Set(
    groups.flatMap((g) => g.items.map((i) => i.type)),
  );
  const uncategorized = Object.entries(DOCUMENT_GUIDES)
    .filter(([type]) => !categorized.has(type))
    .map(([type, guide]) => ({
      type,
      name: guide.name,
      summary: guide.summary,
    }));

  if (uncategorized.length > 0) {
    groups.push({ id: "other", label: "Other", items: uncategorized });
  }

  return groups;
}

const groups = buildGroups();
const totalCount = groups.reduce((n, g) => n + g.items.length, 0);

export const metadata: Metadata = {
  title: "Property Document Guides | Nigerian Real Estate | Academy",
  description:
    "Plain-language guides to every document in a Nigerian land transaction — C of O, Governor's Consent, Deed of Assignment, survey plans, mortgages, and more. What each one proves, who issues it, and what to check before you rely on it.",
  alternates: { canonical: `${SITE_URL}${DOCS_PATH}` },
  openGraph: {
    title: "Property Document Guides",
    description:
      "Understand every document in a Nigerian property transaction — from C of O to probate.",
    url: `${SITE_URL}${DOCS_PATH}`,
    type: "website",
  },
};

export default function DocumentsIndexPage() {
  return (
    <DocumentLibrary
      groups={groups}
      totalCount={totalCount}
      docsPath={DOCS_PATH}
    />
  );
}
