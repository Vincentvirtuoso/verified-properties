import type { Role } from "@affilhomes/shared/types";
import { createClient } from "@affilhomes/shared/supabase/client";

/**
 * Reads the signed-in user's rows from `public.user_roles`.
 * RLS allows "Users can view their own roles", so this is safe
 * from the browser.
 */
export async function fetchUserRoles(userId: string): Promise<Role[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.role as Role);
}
