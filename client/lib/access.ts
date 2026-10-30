import {
  Role,
  type Company,
  type PopulatedUser,
} from "@affilhomes/shared/types";

/** The account holds the agent role. The active view may be something else. */
export function hasAgentRole(user: PopulatedUser | null | undefined): boolean {
  return !!user && user.roles.includes(Role.Agent);
}

/** The account is currently in the agent view. */
export function isInAgentView(user: PopulatedUser | null | undefined): boolean {
  return !!user && user.activeRole === Role.Agent;
}

/** Owners and team members both count. Uses membership, not roles. */
export function hasCompanyAccess(
  user: PopulatedUser | null | undefined,
  companies: Company[],
): boolean {
  if (!user) return false;

  const ownsCompany = !!user.companyId;
  const belongsToCompany = companies.some((company) =>
    company.team.some((member) => member.userId === user._id),
  );

  return ownsCompany || belongsToCompany;
}
