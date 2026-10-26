import type { createAdminBrowserClient } from "@/lib/supabase";
import { AdminRole } from "@/types";
import { ADMIN_ROLES } from "@affilhomes/shared/types";

export async function fetchAdminRoles(
  supabase: ReturnType<typeof createAdminBrowserClient>,
  userId: string,
): Promise<AdminRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? [])
    .map((row) => row.role as AdminRole)
    .filter((role): role is AdminRole => ADMIN_ROLES.includes(role));
}
