"use client";

import {
  LuFileText,
  LuMapPin,
  LuCamera,
  LuBanknote,
  LuCircleCheck,
} from "react-icons/lu";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { useRouter } from "next/dist/client/components/navigation";

const steps = [
  {
    icon: <LuFileText className="w-5 h-5" />,
    value: "step-1",
    title: "Gather your documents",
    tips: [
      "Ensure documents are valid and not expired.",
      "Scan or take clear photos of each document.",
      "Rename files clearly (e.g., C_of_O_123.pdf).",
      "Keep file sizes below 5MB for faster uploads.",
    ],
    documents: [
      "Certificate of Occupancy",
      "Governor’s Consent",
      "Deed of Assignment",
      "Survey Plan",
      "Approved Building Plan",
      "Receipt of Payment",
      "Power of Attorney",
      "Tax Clearance Certificate",
      "Registered Survey Plan",
    ],
  },
  {
    icon: <LuMapPin className="w-5 h-5" />,
    value: "step-2",
    title: "Provide accurate location",
    tips: [
      "Include house number, street name, and nearest landmark.",
      "Select the correct city, state, and country.",
      "If possible, drop a pin to auto‑fill GPS coordinates.",
      "Double‑check spelling to avoid misdirection.",
    ],
  },
  {
    icon: <LuCamera className="w-5 h-5" />,
    value: "step-3",
    title: "Upload high‑quality photos & videos",
    tips: [
      "Use a wide‑angle lens or panorama mode for rooms.",
      "Shoot in natural daylight – avoid dark corners.",
      "Capture every room, the exterior, and any amenities.",
      "Record a steady 1‑minute video walkthrough.",
      "You can upload up to 20 images and 3 video links.",
    ],
  },
  {
    icon: <LuBanknote className="w-5 h-5" />,
    value: "step-4",
    title: "Set the right price & purpose",
    tips: [
      "Research similar properties in the area.",
      "Decide if the price is negotiable.",
      "Consider adding a discount to stand out.",
      "Choose a standard or featured listing tier.",
    ],
  },
  {
    icon: <LuCircleCheck className="w-5 h-5" />,
    value: "step-5",
    title: "Review & publish",
    tips: [
      "Preview every section – description, price, images.",
      "Confirm contact details are correct.",
      "Check your listing status: draft or active.",
      "You can always edit or pause your listing later.",
    ],
  },
];

export default function ListPropertyOnboarding() {
  const router = useRouter();
  if (
    typeof localStorage !== "undefined" &&
    localStorage.getItem("hide_list_property_onboarding")
  ) {
    router.push("/list-property");
    return null;
  }
  return (
    <OnboardingLayout
      title="Ready to list your property? 🏡"
      subtitle="A complete, well‑presented listing attracts more genuine buyers. Here’s what you need to prepare before you start."
      storageKey="hide_list_property_onboarding"
      nextRoute="/list-property"
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
                      Commonly accepted documents
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {step.documents.map((doc, i) => (
                        <div
                          key={i}
                          className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
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
