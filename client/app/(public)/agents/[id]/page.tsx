import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicAgent } from "@/lib/supabase/publicDirectory";
import AgentClient from "../_components/AgentClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchPublicAgent(id, await createClient()).catch(() => null);
  if (!data) return { title: "Agent not found" };
  return {
    title: `${data.agent.name} – Real Estate Agent`,
    description: `View ${data.agent.name}'s live property listings and contact details.`,
  };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchPublicAgent(id, await createClient());

  if (!data) notFound();

  return (
    <AgentClient
      agent={data.agent}
      id={id}
      listings={data.listings}
      closedDeals={data.closedDeals}
    />
  );
}
