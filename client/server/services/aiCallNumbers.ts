import type { SupabaseClient } from "@supabase/supabase-js";

export interface NumberProvider {
  describe(e164: string): { carrier: "mtn" | "other" };
}

export const mockProvider: NumberProvider = {
  describe: () => ({ carrier: "other" }),
};

export async function activateAiCallNumber(
  supabase: SupabaseClient,
  id: string,
  providerRef: string,
) {
  const { error } = await supabase.rpc("activate_ai_call_number", {
    p_id: id,
    p_provider_ref: providerRef,
  });
  if (error) throw error;
}

export async function releaseAiCallNumber(
  supabase: SupabaseClient,
  id: string,
) {
  const { error } = await supabase.rpc("release_ai_call_number", {
    p_id: id,
  });
  if (error) throw error;
}
