import { Suspense } from "react";
import PropertiesContent from "./PropertiesContent";

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PropertiesContent />
    </Suspense>
  );
}