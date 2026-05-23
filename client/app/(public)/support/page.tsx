import { Metadata } from "next";
import SupportClient from "./SupportClient";

export const metadata: Metadata = {
  title: "Support Center | Verified Properties",
  description: "Get help, browse FAQs, or contact our support team.",
};

export default function SupportPage() {
  return <SupportClient />;
}
