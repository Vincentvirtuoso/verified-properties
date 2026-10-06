import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { fetchActivePropertiesByIds } from "@/lib/supabase/publicProperties";
import type { Company, PopulatedProperty, PopulatedUser } from "@/types";

/**
 * Public agents & companies directory (011_public_directory.sql).
 * Only verified agents/companies, or ones with a live listing, are
 * returned — with safe contact fields only.
 */

export type DirectoryAgent = {
  id: string;
  name: string;
  image?: string;
  company?: string;
  phone?: string;
  verified: boolean;
  locations: string[];
  propertyTypes: string[];
  activeListings: number;
  totalListings: number;
  totalValue: number;
};

export type PublicCompany = Company & { teamSize: number; cities: string[] };

const label = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* eslint-disable @typescript-eslint/no-explicit-any */
function toDirectoryAgent(r: any): DirectoryAgent {
  return {
    id: r.id,
    name: r.name,
    image: r.avatar ?? undefined,
    company: r.company_name ?? undefined,
    phone: r.phone ?? undefined,
    verified: r.verification_status === "verified",
    locations: r.cities ?? [],
    propertyTypes: (r.property_types ?? []).map(label),
    activeListings: r.active_listings ?? 0,
    totalListings: (r.active_listings ?? 0) + (r.closed_deals ?? 0),
    totalValue: Number(r.total_value ?? 0),
  };
}

function toUser(r: any): PopulatedUser {
  return {
    _id: r.id,
    name: r.name,
    email: r.email ?? "",
    phone: r.phone ?? undefined,
    whatsappNumber: r.whatsapp_number ?? undefined,
    avatar: r.avatar ?? undefined,
    activeRole: "agent",
    roles: ["agent"],
    isEmailVerified: true,
    isPhoneVerified: false,
    agentProfile: {
      subRole: r.sub_role ?? "agent",
      brokerage: r.brokerage ?? r.company_name ?? undefined,
      verificationStatus: r.verification_status,
      activeListings: r.active_listings ?? 0,
      activeBoostedListings: 0,
    },
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.created_at),
  } as unknown as PopulatedUser;
}

function toCompany(r: any): PublicCompany {
  return {
    _id: r.id,
    name: r.name,
    slug: r.slug,
    logo: r.logo ?? undefined,
    type: r.type,
    verificationStatus: r.verification_status,
    onboardingDocs: { cacCertificateUrl: "" },
    features: {
      whatsappNotifications: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
      whiteLabel: false,
      tier: "standard",
    },
    team: [],
    teamSize: r.team_size ?? 0,
    cities: r.cities ?? [],
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone ?? undefined,
    whatsappNumber: r.whatsapp_number ?? undefined,
    activeListings: r.active_listings ?? 0,
    totalRemitted: 0,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.created_at),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchDirectoryAgents(client?: SupabaseClient): Promise<DirectoryAgent[]> {
  const { data, error } = await (client ?? createClient()).rpc("get_public_agents");
  if (error) throw error;
  return (data ?? []).map(toDirectoryAgent);
}

export async function fetchPublicAgent(
  id: string,
  client?: SupabaseClient,
): Promise<{ agent: PopulatedUser; closedDeals: number; listings: PopulatedProperty[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = client ?? createClient();
  const { data, error } = await supabase.rpc("get_public_agents", { _id: id });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;

  const { data: rows, error: e2 } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (e2) throw e2;

  const listings = await fetchActivePropertiesByIds(
    (rows ?? []).map((r) => r.id as string),
    supabase,
  );
  return { agent: toUser(row), closedDeals: row.closed_deals ?? 0, listings };
}

export async function fetchPublicCompanies(client?: SupabaseClient): Promise<PublicCompany[]> {
  const { data, error } = await (client ?? createClient()).rpc("get_public_companies");
  if (error) throw error;
  return (data ?? []).map(toCompany);
}

export async function fetchPublicCompany(
  idOrSlug: string,
  client?: SupabaseClient,
): Promise<{ company: PublicCompany; listings: PopulatedProperty[] } | null> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase.rpc("get_public_companies", {
    _id_or_slug: idOrSlug.slice(0, 120),
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;

  const { data: ids, error: e2 } = await supabase.rpc("get_public_company_listing_ids", {
    _company_id: row.id,
  });
  if (e2) throw e2;
  const listings = await fetchActivePropertiesByIds((ids ?? []) as string[], supabase);
  return { company: toCompany(row), listings };
}
