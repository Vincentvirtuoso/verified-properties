import { Suspense } from "react";
import PropertiesContent from "./PropertiesContent";
import { PageSpinner } from "@/components/ui/Spinner";

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={<PageSpinner label="Loading properties page content..." />}
    >
      <PropertiesContent />
    </Suspense>
  );
}
