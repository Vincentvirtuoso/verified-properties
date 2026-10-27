export type CompanyType = "real_estate_company" | "developer" | "broker";

export type CompanyVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export interface CompanyFeatures {
  whatsappNotifications: boolean;
  prioritySupport: boolean;
  dedicatedAccountManager: boolean;
  whiteLabel: boolean;
  tier: "standard" | "pro";
}

export interface CompanyMember {
  userId: string;
  role: "admin" | "member";
  permissions: CompanyPermission[];
}

export type CompanyPermission =
  | "manage_listings"
  | "manage_members"
  | "view_analytics";

export interface CompanyOnboardingDocs {
  cacCertificateUrl: string;
  companyLogoUrl?: string;
  proofOfAddressUrl?: string;
  additionalDocs?: {
    label: string;
    fileUrl: string;
  }[];
}

export interface Company {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  type: CompanyType;

  verificationStatus: CompanyVerificationStatus;
  onboardingDocs: CompanyOnboardingDocs;

  features: CompanyFeatures;

  team: CompanyMember[];

  contactEmail: string;
  contactPhone?: string;
  whatsappNumber?: string;

  activeListings: number;

  totalRemitted: number;
  remittanceDetails?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const companyTypeLabels: Record<CompanyType, string> = {
  real_estate_company: "Real Estate Company",
  developer: "Real Estate Developer",
  broker: "Real Estate Broker",
};

export interface CompanyRegistration {
  id: string;
  status: "draft" | "docs_submitted" | "rejected";
  companyName: string;
  companyType: CompanyType | null;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantAuthorised: boolean;
  logoUrl: string | null;
  rejectionReason: string | null;
}

export interface CompanyRegistrationDraft {
  companyName: string;
  companyType: CompanyRegistration["companyType"];
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  applicantName: string;
  applicantPhone: string;
}

export interface CompanyRegistrationSubmission {
  cacCertificate: File;
  logo?: File | null;
  authorised: boolean;
}
