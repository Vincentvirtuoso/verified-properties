import { Company } from "./company";

export enum Role {
  Viewer = "viewer",
  Agent = "agent",
  Company = "company",
}

export const LOCKED_ROLES: Role[] = [Role.Company];

export const PARTNER_ROLES: Role[] = [Role.Company];

export type AgentSubRole =
  | "realtor"
  | "lawyer"
  | "surveyor"
  | "landlord"
  | "other";

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
  subRole: AgentSubRole;

  logo?: string;
  verificationDocs?: AgentVerificationDocs;

  verificationStatus: "unverified" | "pending" | "verified" | "rejected";

  activeListings: number;
  activeBoostedListings: number;

  licenseNumber?: string;
  barNumber?: string;
  surveyorRegNumber?: string;
  brokerage?: string;
}

export interface AgentVerificationDocs {
  logoUrl: string;
  governmentIdUrl?: string;
  professionalCertUrl?: string;
  utilityBillUrl?: string;
  additionalDocs?: {
    label: string;
    fileUrl: string;
  }[];
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

export const agentSubRoleLabels: Record<AgentSubRole, string> = {
  realtor: "Realtor",
  lawyer: "Lawyer",
  surveyor: "Surveyor",
  landlord: "Landlord",
  other: "Other",
};
