import { RequireCompany } from "@/components/access/RouteGates";
import { ProBanner } from "@/components/company/ProBanner";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireCompany>
      <div className="space-y-4 p-4 md:p-6">
        <ProBanner />
        {children}
      </div>
    </RequireCompany>
  );
}
