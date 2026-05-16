import { Company } from "./company";

export enum Role {
  Viewer = "viewer",
  Agent = "agent",
  Landlord = "landlord",
  Developer = "developer",
  Company = "company",
}

export const LOCKED_ROLES: Role[] = [Role.Developer, Role.Company];

export const PARTNER_ROLES: Role[] = [
  Role.Landlord,
  Role.Developer,
  Role.Company,
];

export interface User<Populated extends boolean = false> {
  _id: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;

  roles: Role[];
  activeRole: Role;

  viewerProfile?: ViewerProfile;
  agentProfile?: AgentProfile;
  landlordProfile?: LandlordProfile;

  companyId?: Populated extends true ? Company : string;
  companyRole?: "admin" | "member";

  createdAt: Date;
  updatedAt: Date;

  metadata?: {
    lastRoleSwitch?: Date | null;
  };
}

export type PopulatedUser = User<true>;

export interface ViewerProfile {
  savedListingIds: string[];
  budgetRange?: {
    min: number;
    max: number;
    currency: string;
  };
  preferredLocations?: string[];
}

export interface AgentProfile {
  licenseNumber?: string;
  brokerage?: string;
  verificationStatus: "unverified" | "pending" | "verified";
  activeListings: number;
  activeBoostedListings: number;
}

export interface LandlordProfile {
  verificationStatus: "unverified" | "pending" | "verified";
  activeListings: number;
  remittanceDetails?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
  totalRemitted: number;
}

export type BoostStatus = "active" | "expired" | "cancelled";

export interface Boost {
  _id: string;
  listingId: string;
  agentId: string;
  amountPaid: number;
  currency: string;
  status: BoostStatus;
  startDate: Date;
  expiryDate: Date;
  paymentReference: string;
  createdAt: Date;
}
