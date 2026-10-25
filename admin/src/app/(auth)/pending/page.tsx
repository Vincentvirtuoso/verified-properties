import type { Metadata } from "next";

import { PendingStatus } from "@/features/auth/components/PendingStatus";

export const metadata: Metadata = {
  title: "Application under review",
};

export default function PendingPage() {
  return <PendingStatus />;
}
