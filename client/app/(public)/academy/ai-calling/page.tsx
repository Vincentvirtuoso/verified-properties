import { Metadata } from "next";
import AICallingPageClient from "./AICallingPageClient";

export const metadata: Metadata = {
  title: "How AI Calling Works | Academy",
  description:
    "The moment you enquire about a property, an assistant calls you back — see exactly how it works, from first call to inspection day.",
  keywords: ["ai calling", "property enquiry", "instant callback", "academy"],
  alternates: {
    canonical: "https://yourwebsite.com/academy/ai-calling",
  },
};

export default function AICallingPage() {
  return <AICallingPageClient />;
}