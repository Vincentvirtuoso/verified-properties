"use client";

import {
  LuBuilding,
  LuUsers,
  LuShieldCheck,
  LuHouse,
  LuCircleCheck,
} from "react-icons/lu";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmDialog";
import { useRouter } from "next/dist/client/components/navigation";

const steps = [
  {
    icon: <LuBuilding className="w-5 h-5" />,
    value: "profile",
    title: "Register your company profile",
    tips: [
      "Use your registered business name.",
      "Upload a high‑resolution logo (square, min 200×200px).",
      "Provide a valid business email and phone number.",
      "Set your company type: real estate company or developer.",
    ],
  },
  {
    icon: <LuUsers className="w-5 h-5" />,
    value: "team",
    title: "Add team members",
    tips: [
      "Assign roles (admin / member) and permissions.",
      "Team members can act on behalf of the company.",
      "You can manage the team anytime from settings.",
      "Admins have full control; members can only manage listings.",
    ],
  },
  {
    icon: <LuShieldCheck className="w-5 h-5" />,
    value: "verify",
    title: "Verify your company",
    tips: [
      "Submit your CAC registration certificate.",
      "Provide a memorandum and articles of association.",
      "Tax clearance certificate may be required.",
      "Verification review takes 2–5 business days.",
    ],
    documents: [
      "CAC Certificate of Incorporation",
      "Memorandum & Articles of Association",
      "Company Tax ID (TIN)",
      "Tax Clearance Certificate",
      "Utility Bill of business address",
    ],
  },
  {
    icon: <LuHouse className="w-5 h-5" />,
    value: "list",
    title: "Start listing properties",
    tips: [
      "All listings will show your company name and logo.",
      "Boost featured listings for maximum exposure.",
      "Monitor inquiries and deals from the company dashboard.",
      "Set up remittance details for seamless payouts.",
    ],
  },
];

export default function CompanyOnboarding() {
  const { logout } = useAuth();
  const { confirm } = useConfirm();

  const router = useRouter();
  if (
    typeof localStorage !== "undefined" &&
    localStorage.getItem("hide_company_onboarding")
  ) {
    router.push("/list-property");
    return null;
  }

  const handleContinue = async () => {
    const confirmed = await confirm({
      title: "You'll be logged out",
      message:
        "To register a company, you'll be logged out of your current session. All unsaved changes on this page will be lost. Continue?",
      confirmLabel: "Log out & continue",
      cancelLabel: "Stay here",
      variant: "warning",
      rememberKey: "hide_logout_warning_company",
      rememberLabel: "Don't ask me again",
    });

    if (confirmed) {
      await logout();
      window.location.href = "/register/?accountType=company";
    }
  };
  return (
    <OnboardingLayout
      title="Register your company 🏢"
      subtitle="Build your brand on our platform, manage a team, and list properties at scale. Here’s how to get started."
      steps={steps.map((s) => ({ icon: s.icon, title: s.title }))}
      storageKey="hide_company_onboarding"
      onContinue={handleContinue}
    >
      <Accordion>
        {steps.map((step) => (
          <AccordionItem key={step.value} value={step.value}>
            <AccordionTrigger icon={step.icon}>{step.title}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
                    Tips
                  </h4>
                  <ul className="space-y-1.5">
                    {step.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                      >
                        <LuCircleCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                {step.documents && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
                      Required Documents
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {step.documents.map((doc, i) => (
                        <div
                          key={i}
                          className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </OnboardingLayout>
  );
}
