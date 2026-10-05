"use client";

import {
  LuUser,
  LuShieldCheck,
  LuWallet,
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
import { Role } from "@/types";
import { useRouter } from "next/dist/client/components/navigation";

const steps = [
  {
    icon: <LuUser className="w-5 h-5" />,
    value: "profile",
    title: "Complete your profile",
    tips: [
      "Use your real name as it appears on your ID.",
      "Upload a clear, friendly profile picture.",
      "Add your phone number and WhatsApp for faster communication.",
      "Set your active role to Agent or Landlord in settings.",
    ],
  },
  {
    icon: <LuShieldCheck className="w-5 h-5" />,
    value: "verify",
    title: "Verify your identity",
    tips: [
      "Submit a valid government‑issued ID (national ID, passport, driver’s licence).",
      "Provide a recent utility bill or bank statement as proof of address.",
      "Selfie holding your ID may be required for facial match.",
      "Verification usually takes 24–48 hours.",
    ],
    documents: [
      "National ID Card",
      "International Passport",
      "Driver’s Licence",
      "Utility Bill (not older than 3 months)",
      "Bank Statement with current address",
    ],
  },
  {
    icon: <LuWallet className="w-5 h-5" />,
    value: "payment",
    title: "Set up payment details",
    tips: [
      "Provide a bank account in your name.",
      "Ensure the account supports NGN transfers.",
      "Verify your BVN for faster processing.",
      "Payouts are processed weekly.",
    ],
  },
  {
    icon: <LuHouse className="w-5 h-5" />,
    value: "list",
    title: "Start listing properties",
    tips: [
      "Complete the listing details fully.",
      "Respond to inquiries quickly – it improves your ranking.",
      "Boost your listing for more visibility.",
      "Keep your profile updated as you grow.",
    ],
  },
];

export default function BecomeAgentLandlordOnboarding() {
  const { user } = useAuth();

  const nextRoute = user?.roles.includes(Role.Agent)
    ? "/dashboard"
    : user?.activeRole === Role.Viewer
      ? `/add-role?from=${user?.activeRole}&to=${Role.Agent}`
      : "/dashboard";

  const router = useRouter();
  if (
    typeof localStorage !== "undefined" &&
    localStorage.getItem("hide_agent_landlord_onboarding")
  ) {
    router.push("/list-property");
    return null;
  }

  return (
    <OnboardingLayout
      title="Become an Agent or Landlord 🤝"
      subtitle="Unlock the ability to list properties, connect with clients, and earn more. Here’s what you need to get started."
      storageKey="hide_agent_landlord_onboarding"
      nextRoute={nextRoute}
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
                      Required / Accepted Documents
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {step.documents.map((doc, i) => (
                        <div
                          key={i}
                          className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
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
