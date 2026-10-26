import type { SupabaseClient } from "@supabase/supabase-js";
import { Role, SELF_ASSIGNABLE_ROLES } from "../types";

export async function setMyRoles(roles: Role[], client: SupabaseClient) {
  const { error } = await client.rpc("set_my_roles", {
    _roles: roles.filter((r) => SELF_ASSIGNABLE_ROLES.includes(r)),
  });
  if (error) throw error;
}

export async function switchActiveRole(role: Role, client: SupabaseClient) {
  const { error } = await client.rpc("switch_active_role", { _role: role });
  if (error) throw error;
}
