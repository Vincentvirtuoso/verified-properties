import { createClient } from "@affilhomes/shared/supabase/client";

export type AgentSubRole = "realtor" | "lawyer" | "surveyor" | "landlord";

export interface AgentSettingsInput {
  name: string;
  phone: string;
  whatsappNumber: string;
  subRole: AgentSubRole;
  licenseNumber: string;
  brokerage: string;
}

export async function updateAgentSettings(
  userId: string,
  input: AgentSettingsInput,
) {
  const supabase = createClient();

  const { data: current, error: readError } = await supabase
    .from("profiles")
    .select("agent_profile")
    .eq("id", userId)
    .single();
  if (readError) throw readError;

  const agentProfile = {
    ...(current?.agent_profile ?? {}),
    subRole: input.subRole,
    licenseNumber: input.licenseNumber.trim(),
    brokerage: input.brokerage.trim() || null,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      name: input.name.trim(),
      phone: input.phone.trim(),
      whatsapp_number: input.whatsappNumber.trim(),
      agent_profile: agentProfile,
    })
    .eq("id", userId);
  if (error) throw error;
}
