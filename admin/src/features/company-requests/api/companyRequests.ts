import { createClient } from "@affilhomes/shared/supabase/client";
import type { CompanyType } from "@affilhomes/shared/types";

export type RejectionScope = "cac_document" | "details" | "other";

export interface CompanyRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string | null;
  applicantPhone: string | null;
  applicantAuthorised: boolean;
  companyName: string;
  companyType: CompanyType | null;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  logoUrl: string | null;
  cacSha256: string | null;
  cacCertPath: string | null;
  submittedAt: string;
}

export interface CertificateMatch {
  id: string;
  companyName: string;
  status: string;
}

type ProfileJoin = { name: string | null; email: string | null };

interface RegistrationRow {
  id: string;
  user_id: string;
  company_name: string | null;
  company_type: CompanyType | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  logo_url: string | null;
  cac_cert_path: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  applicant_authorised: boolean | null;
  authorised_at: string | null;
  updated_at: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
}

const SELECT = [
  "id",
  "user_id",
  "company_name",
  "company_type",
  "contact_email",
  "contact_phone",
  "whatsapp_number",
  "logo_url",
  "cac_cert_path",
  "cac_sha256",
  "applicant_name",
  "applicant_email",
  "applicant_phone",
  "applicant_authorised",
  "authorised_at",
  "updated_at",
  "profiles:user_id(name, email)",
].join(", ");

function toError(error: { message: string }): Error {
  return new Error(error.message);
}

function mapRow(row: RegistrationRow): CompanyRequest {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    id: row.id,
    applicantId: row.user_id,
    applicantName: row.applicant_name ?? profile?.name ?? "Unknown applicant",
    applicantEmail: row.applicant_email ?? profile?.email ?? null,
    applicantPhone: row.applicant_phone,
    applicantAuthorised: row.applicant_authorised ?? false,
    companyName: row.company_name ?? "Unnamed company",
    companyType: row.company_type,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    whatsappNumber: row.whatsapp_number,
    logoUrl: row.logo_url,
    cacCertPath: row.cac_cert_path,
    submittedAt: row.authorised_at ?? row.updated_at,
    cacSha256: row.cac_cert_path ?? null,
  };
}

export async function listPendingCompanyRequests(): Promise<CompanyRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("company_registrations")
    .select(SELECT)
    .eq("status", "docs_submitted")
    .order("authorised_at", { ascending: true, nullsFirst: false });

  if (error) throw toError(error);
  return ((data ?? []) as unknown as RegistrationRow[]).map(mapRow);
}

export async function getCacDocumentUrl(path: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("company-documents")
    .createSignedUrl(path, 300);

  if (error) throw toError(error);
  return data.signedUrl;
}

export async function approveCompanyRegistration(
  registrationId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("approve_company_registration", {
    p_registration_id: registrationId,
  });
  if (error) throw toError(error);
}

export async function rejectCompanyRegistration(
  registrationId: string,
  scope: RejectionScope,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed)
    throw new Error("A reason is required to reject an application.");

  const supabase = createClient();
  const { error } = await supabase.rpc("reject_company_registration", {
    p_registration_id: registrationId,
    p_scope: scope,
    p_reason: trimmed,
  });
  if (error) throw toError(error);
}

export async function findMatchingCertificates(
  hash: string,
  applicantId: string,
): Promise<CertificateMatch[]> {
  const { data, error } = await createClient()
    .from("company_registrations")
    .select("id, company_name, status")
    .eq("cac_sha256", hash)
    .neq("user_id", applicantId)
    .limit(5);

  if (error) throw toError(error);

  return (
    (data ?? []) as {
      id: string;
      company_name: string | null;
      status: string;
    }[]
  ).map((row) => ({
    id: row.id,
    companyName: row.company_name ?? "Unnamed company",
    status: row.status,
  }));
}
