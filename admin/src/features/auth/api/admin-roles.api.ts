import type { createAdminBrowserClient } from "@/lib/supabase";

export type AdminRole = "admin" | "super_admin";

const ADMIN_ROLES: readonly string[] = ["admin", "super_admin"];

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
    .map((row) => row.role as string)
    .filter((role): role is AdminRole => ADMIN_ROLES.includes(role));
}