export enum Role {
  Buyer = "buyer",
  Agent = "agent",
  Landlord = "landlord", // individual acting as landlord
  Developer = "developer", // individual acting as developer
  Company = "company", // acting on behalf of a company
}

export enum PersonalPlan {
  Free = "free",
  Partnership = "partnership",
}

export interface AgentProfile {
  licenseNumber?: string;
  brokerage?: string;
  freeListingsUsed: number;
  verified?: boolean;
  maxFreeListings: number;
}

export interface BuyerProfile {
  savedSearchIds: string[];
  budgetRange?: {
    min: number;
    max: number;
    currency: string;
  };
  preferredLocations?: string[];
}

export interface PersonalPartnership {
  plan: PersonalPlan;
  status: "active" | "cancelled" | "past_due";
  features: {
    unlimitedListings: boolean;
    whatsappBot: boolean;
    prioritySupport: boolean;
    accountManager: boolean;
  };
  listingQuota: number;
  currentListings: number;
  subscriptionExpiry?: Date;
  autoRenew: boolean;
}

export interface User {
  _id: string;
  email: string;
  phone?: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  isEmailVerified: boolean;
  roles: Role[];
  activeRole: Role;

  agentProfile?: AgentProfile;
  buyerProfile?: BuyerProfile;

  currentPersonalPlan: PersonalPlan;
  personalPartnership?: PersonalPartnership;

  companyId?: string;
  companyRole?: "admin" | "member";

  createdAt: Date;
  updatedAt: Date;

  metadata?: {
    lastRoleSwitch: Date | string | null;
  };
}
