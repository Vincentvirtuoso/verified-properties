import { createClient } from "@/lib/supabase/client";
import type { Company, CompanyMember } from "@/types";

export interface CreateCompanyInput {
  name: string;
  slug: string;
  type: "real_estate_company" | "developer" | "broker";
  contactEmail: string;
  contactPhone?: string;
  whatsappNumber?: string;
  logo?: string;
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
  // Short suffix keeps slugs unique without an extra round-trip.
  return `${base || "company"}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createCompanyForCurrentUser(
  input: CreateCompanyInput,
) {
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

  const { data, error } = await supabase.rpc(
    "submit_company_onboarding_docs",
    { p_company_id: companyId, p_docs: docs },
  );

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
      { name: p.name as string, avatar: p.avatar ?? undefined, email: p.email ?? undefined },
    ]),
  );
}
