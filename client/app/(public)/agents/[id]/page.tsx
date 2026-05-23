import { notFound } from "next/navigation";
import { Role } from "@/types/user";
import { dummyUsers } from "@/data/users";
import AgentClient from "../_components/AgentClient";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = dummyUsers.find(
    (u) => u._id === id && u.roles.includes(Role.Agent),
  );

  if (!agent) notFound();

  return <AgentClient agent={agent} id={id} />;
}
