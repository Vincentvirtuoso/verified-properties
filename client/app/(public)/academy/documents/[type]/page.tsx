import {
  DOCUMENT_GUIDES,
  LEGACY_DOCUMENT_GUIDE_ALIASES,
  getDocumentGuide,
} from "@/utils/guides";
import type { PropertyDocumentType } from "@affilhomes/shared/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  Breadcrumbs,
  BreadcrumbSchema,
  type BreadcrumbItem,
} from "@/components/common/BreadCrumbs";
import { LuFiles, LuFileText, LuGraduationCap, LuLibrary } from "react-icons/lu";

const SITE_URL = "https://yourwebsite.com";
const DOCS_PATH = "/academy/documents";

const RELATED: Partial<Record<PropertyDocumentType, PropertyDocumentType[]>> = {
  certificateOfOccupancy: [
    "governorsConsent",
    "surveyPlan",
    "deedOfAssignment",
  ],
  certificateOfStatutoryRightOfOccupancy: ["governorsConsent", "surveyPlan"],
  governorsConsent: [
    "certificateOfOccupancy",
    "deedOfAssignment",
    "taxClearanceCertificate",
  ],
  deedOfAssignment: [
    "governorsConsent",
    "certificateOfOccupancy",
    "surveyPlan",
  ],
  deedOfConveyance: ["deedOfAssignment", "surveyPlan"],
  deedOfMortgage: ["deedOfAssignment", "powerOfAttorney"],
  surveyPlan: ["registeredSurveyPlan", "certificateOfOccupancy"],
  registeredSurveyPlan: ["surveyPlan", "certificateOfOccupancy"],
  powerOfAttorney: ["irrevocablePowerOfAttorney", "deedOfAssignment"],
  irrevocablePowerOfAttorney: ["powerOfAttorney", "deedOfMortgage"],
  probateLetterOfAdministration: ["deedOfAssignment"],
  excisionDocument: ["gazette", "letterOfAllocation"],
  gazette: ["excisionDocument", "certificateOfOccupancy"],
  letterOfAllocation: ["certificateOfOccupancy", "receiptOfPaymentForLand"],
  contractOfSale: ["landPurchaseAgreement", "deedOfAssignment"],
  landPurchaseAgreement: [
    "contractOfSale",
    "receiptOfPaymentForLand",
    "deedOfAssignment",
  ],
  receiptOfPaymentForLand: ["contractOfSale", "landPurchaseAgreement"],
};

type Props = { params: Promise<{ type: string }> };

export function generateStaticParams() {
  const canonical = Object.keys(DOCUMENT_GUIDES).map((type) => ({ type }));
  const legacy = Object.keys(LEGACY_DOCUMENT_GUIDE_ALIASES).map((type) => ({
    type,
  }));
  return [...canonical, ...legacy];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const guide = getDocumentGuide(type);

  if (!guide) return { title: "Document | Academy" };

  const url = `${SITE_URL}${DOCS_PATH}/${type}`;
  return {
    title: `${guide.name} | Academy`,
    description: guide.summary,
    alternates: { canonical: url },
    openGraph: {
      title: `${guide.name} | Academy`,
      description: guide.summary,
      url,
      type: "article",
    },
  };
}

export default async function DocumentGuidePage({ params }: Props) {
  const { type } = await params;

  if (type in LEGACY_DOCUMENT_GUIDE_ALIASES) {
    permanentRedirect(`${DOCS_PATH}/${LEGACY_DOCUMENT_GUIDE_ALIASES[type]}`);
  }

  const guide = getDocumentGuide(type);
  if (!guide) notFound();

  const canonicalType = type as PropertyDocumentType;
  const related = (RELATED[canonicalType] ?? []).map((key) => ({
    key,
    guide: DOCUMENT_GUIDES[key],
  }));

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Academy", href: "/academy", icon: <LuGraduationCap /> },
    { label: "Documents", href: DOCS_PATH, icon: <LuFiles /> },
    { label: guide.name },
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />
      <BreadcrumbSchema items={breadcrumbItems} />

      <h1 className="text-2xl font-semibold text-foreground">{guide.name}</h1>
      <p className="mt-3 text-base leading-relaxed text-foreground">
        {guide.summary}
      </p>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-foreground">
          What it proves
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {guide.whatItProves}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-semibold text-foreground">
          Who issues it
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {guide.whoIssues}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-semibold text-foreground">
          Questions to ask
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
          {guide.whatToAsk.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-base font-semibold text-foreground">
            Related documents
          </h2>
          <ul className="mt-3 space-y-2">
            {related.map(({ key, guide: r }) => (
              <li key={key}>
                <Link
                  href={`${DOCS_PATH}/${key}`}
                  className="text-sm font-medium text-foreground underline underline-offset-2 hover:text-primary"
                >
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <aside className="mt-10 rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs leading-relaxed text-muted">
          <strong className="text-foreground">Not legal advice.</strong> This
          guide is general educational content. Document requirements and
          procedures vary by state and by transaction. For a specific property,
          consult a licensed conveyancing lawyer or your state lands registry.
        </p>
      </aside>

      <p className="mt-8 text-sm text-muted">
        Need help with a specific document?{" "}
        <Link
          href="/help"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          Visit the help centre
        </Link>
        .
      </p>
    </main>
  );
}
