import type { Role } from "@affilhomes/shared/types";

export type AdminRole = "admin" | "super_admin";

export type EffectiveRole = Role | null;

export function resolveAdminRole(roles: AdminRole[]): AdminRole | null {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  return null;
}
