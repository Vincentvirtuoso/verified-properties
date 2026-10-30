import { RequireAgentOrCompany } from "@/components/access/RouteGates";

export default function ListPropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAgentOrCompany>{children}</RequireAgentOrCompany>;
}
