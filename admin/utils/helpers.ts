import { AdminRole } from "@/types";
import { Role } from "@affilhomes/shared/types";

export function resolveAdminRole(roles: AdminRole[]): AdminRole | null {
  if (roles.includes(Role.SuperAdmin)) return Role.SuperAdmin;
  if (roles.includes(Role.Admin)) return Role.Admin;
  return null;
}
