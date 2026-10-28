import { createClient } from "./client";
import type {
  Company,
  CompanyMember,
  CompanyMemberDetails,
  CompanyPermission,
} from "../types";

export type InvitableRole = "admin" | "member";

export const ALL_PERMISSIONS: CompanyPermission[] = [
  "manage_listings",
  "manage_members",
  "view_analytics",
];

export const PERMISSION_LABELS: Record<CompanyPermission, string> = {
  manage_listings: "Manage listings",
  manage_members: "Manage members",
  view_analytics: "View analytics",
};

export interface CompanyInvitation {
  id: string;
  email: string;
  role: InvitableRole;
  permissions: CompanyPermission[];
  expiresAt: string;
  createdAt: string;
}

export interface InviteInput {
  companyId: string;
  email: string;
  role: InvitableRole;
  permissions: CompanyPermission[];
}
export interface CreateCompanyInput {
  name: string;
  slug: string;
  type: "real_estate_company" | "developer" | "broker";
  contactEmail: string;
  contactPhone?: string;
  whatsappNumber?: string;
  logo?: string;
}

export type InviteErrorCode =
  | "signed_out"
  | "not_found"
  | "revoked"
  | "used"
  | "expired"
  | "unconfirmed"
  | "wrong_email"
  | "profile_missing"
  | "already_in_company"
  | "pending_application"
  | "unknown";

const INVITE_CODES = new Set<string>([
  "signed_out",
  "not_found",
  "revoked",
  "used",
  "expired",
  "unconfirmed",
  "wrong_email",
  "profile_missing",
  "already_in_company",
  "pending_application",
]);

export class InviteError extends Error {
  readonly code: InviteErrorCode;
  readonly invitedEmail?: string;

  constructor(code: InviteErrorCode, message: string, invitedEmail?: string) {
    super(message);
    this.name = "InviteError";
    this.code = code;
    this.invitedEmail = invitedEmail;
  }
}

function toInviteError(error: {
  message: string;
  hint?: string | null;
  details?: string | null;
}): InviteError {
  const hint = error.hint ?? "";
  const code = (INVITE_CODES.has(hint) ? hint : "unknown") as InviteErrorCode;
  return new InviteError(
    code,
    error.message,
    code === "wrong_email" ? (error.details ?? undefined) : undefined,
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapCompanyRow(row: any, members: any[] = []): Company {
  return {
    _id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo ?? undefined,
    type: row.type,
    verificationStatus: row.verification_status,
    onboardingDocs: row.onboarding_docs ?? { cacCertificateUrl: "" },
    features: row.features,
    team: members.map(
      (m): CompanyMember => ({
        userId: m.user_id,
        role: m.role,
        permissions: Array.isArray(m.permissions) ? m.permissions : [],
      }),
    ),
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone ?? undefined,
    whatsappNumber: row.whatsapp_number ?? undefined,
    activeListings: row.active_listings ?? 0,
    totalRemitted: Number(row.total_remitted ?? 0),
    remittanceDetails: row.remittance_details ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function slugifyCompanyName(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "company"}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createCompanyForCurrentUser(input: CreateCompanyInput) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "create_company_for_current_user",
    {
      p_name: input.name,
      p_slug: input.slug,
      p_type: input.type,
      p_contact_email: input.contactEmail,
      p_contact_phone: input.contactPhone ?? null,
      p_whatsapp_number: input.whatsappNumber ?? null,
      p_logo: input.logo ?? null,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function submitCompanyOnboardingDocs(
  companyId: string,
  docs: { cacCertificateUrl: string; companyLogoUrl?: string },
) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("submit_company_onboarding_docs", {
    p_company_id: companyId,
    p_docs: docs,
  });

  if (error) {
    throw error;
  }

  return data;
}

/** Loads a company plus its members (RLS: caller must be a member). */
export async function getCompanyWithTeam(
  companyId: string,
): Promise<Company | null> {
  const supabase = createClient();

  const [{ data: company, error }, { data: members, error: membersError }] =
    await Promise.all([
      supabase.from("companies").select("*").eq("id", companyId).maybeSingle(),
      supabase
        .from("company_members")
        .select("user_id, role, permissions")
        .eq("company_id", companyId),
    ]);

  if (error) throw error;
  if (membersError) throw membersError;
  if (!company) return null;

  return mapCompanyRow(company, members ?? []);
}

function toError(error: { message: string }) {
  return new Error(error.message);
}

async function functionErrorMessage(error: unknown): Promise<string> {
  const response = (error as { context?: Response }).context;
  if (response) {
    try {
      const body = await response.json();
      if (body?.error) return body.error as string;
    } catch {
      // Not JSON; fall through to the generic message.
    }
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function listPendingInvitations(
  companyId: string,
): Promise<CompanyInvitation[]> {
  const { data, error } = await createClient()
    .from("company_invitations")
    .select("id, email, role, permissions, expires_at, created_at")
    .eq("company_id", companyId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw toError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    permissions: row.permissions ?? [],
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

export async function inviteCompanyMember(input: InviteInput): Promise<void> {
  const { data, error } = await createClient().functions.invoke(
    "invite-company-member",
    { body: input },
  );
  if (error) throw new Error(await functionErrorMessage(error));
  if (!data?.ok) throw new Error("The invitation couldn't be sent.");
}

export async function acceptCompanyInvitation(token: string): Promise<string> {
  const { data, error } = await createClient().rpc(
    "accept_company_invitation",
    { p_token: token },
  );
  if (error) throw toInviteError(error);
  return data as string;
}

export async function revokeCompanyInvitation(invitationId: string) {
  const { error } = await createClient().rpc("revoke_company_invitation", {
    p_invitation_id: invitationId,
  });
  if (error) throw toError(error);
}

export async function removeCompanyMember(companyId: string, userId: string) {
  const { error } = await createClient().rpc("remove_company_member", {
    p_company_id: companyId,
    p_user_id: userId,
  });
  if (error) throw toError(error);
}

export async function getCompanyMemberDetails(
  companyId: string,
  userId: string,
): Promise<CompanyMemberDetails> {
  const { data, error } = await createClient().rpc(
    "get_company_member_details",
    { p_company_id: companyId, p_user_id: userId },
  );
  if (error) throw toError(error);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Member not found");

  return {
    name: row.name ?? null,
    email: row.email ?? null,
    joinedAt: row.joined_at ?? null,
  };
}

/* ---------- company dashboard (012_company_dashboard.sql) ---------- */

export interface CompanyDashboardStats {
  teamSize: number;
  activeListings: number;
  draftListings: number;
  hiddenListings: number;
  closedDeals: number;
  liveValue: number;
  totalEnquiries: number;
  openEnquiries: number;
}

/** Live numbers for the company dashboard (members only). */
export async function fetchCompanyDashboardStats(
  companyId: string,
): Promise<CompanyDashboardStats> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_company_dashboard_stats", {
    _company_id: companyId,
  });
  if (error) throw error;
  const r = data?.[0] ?? {};
  return {
    teamSize: r.team_size ?? 0,
    activeListings: r.active_listings ?? 0,
    draftListings: r.draft_listings ?? 0,
    hiddenListings: r.hidden_listings ?? 0,
    closedDeals: r.closed_deals ?? 0,
    liveValue: Number(r.live_value ?? 0),
    totalEnquiries: r.total_enquiries ?? 0,
    openEnquiries: r.open_enquiries ?? 0,
  };
}

/** Names/photos of teammates (RLS: people who share your company). */
export async function fetchTeamProfiles(
  userIds: string[],
): Promise<Map<string, { name: string; avatar?: string; email?: string }>> {
  if (userIds.length === 0) return new Map();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar, email")
    .in("id", userIds);
  if (error) throw error;
  return new Map(
    (data ?? []).map((p) => [
      p.id as string,
      {
        name: p.name as string,
        avatar: p.avatar ?? undefined,
        email: p.email ?? undefined,
      },
    ]),
  );
}
