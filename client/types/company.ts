export type CompanyType = "real_estate_company" | "developer";

export interface CompanyFeatures {
  whatsappNotifications: boolean;
  prioritySupport: boolean;
  dedicatedAccountManager: boolean;
  whiteLabel: boolean;
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

export interface Company {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  type: CompanyType;
  verificationStatus: "unverified" | "pending" | "verified";

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
