import { RequireAgent } from "@/components/access/RouteGates";

export default function AgentListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAgent>{children}</RequireAgent>;
}
