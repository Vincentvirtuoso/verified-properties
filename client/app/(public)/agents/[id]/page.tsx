import type { Metadata } from "next";
import { createClient } from "@affilhomes/shared/supabase/client";
import { fetchPublicAgent } from "@affilhomes/shared/supabase";
import AgentClient from "../_components/AgentClient";
import { AgentUnavailable } from "../_components/AgentUnavailable";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchPublicAgent(id, createClient()).catch(() => null);
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

  let data;
  try {
    data = await fetchPublicAgent(id, createClient());
  } catch (error) {
    console.error("Failed to load agent", id, error);
    return <AgentUnavailable variant="error" agentId={id} />;
  }

  if (!data) {
    return <AgentUnavailable variant="not-found" />;
  }

  return (
    <AgentClient
      agent={data.agent}
      id={id}
      listings={data.listings}
      closedDeals={data.closedDeals}
    />
  );
}
