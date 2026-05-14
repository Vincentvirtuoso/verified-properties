export interface CompanyMember {
  userId: string;
  role: "admin" | "member";
  permissions: string[];
}

export interface CompanyPartnership {
  plan: "partnership_basic" | "partnership_gold";
  status: "active" | "cancelled" | "past_due" | "trialing";
  trialEndsAt?: Date;
  features: {
    unlimitedListings: boolean;
    whatsappBot: boolean;
    prioritySupport: boolean;
    dedicatedAccountManager: boolean;
    whiteLabel?: boolean;
  };
  listingQuota: number;
  currentListings: number;
  subscriptionExpiry?: Date;
  paymentMethodId?: string;
}

export interface Company {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  type: "real_estate_company" | "landlord_entity" | "developer_entity";
  partnership: CompanyPartnership;
  team: CompanyMember[];
  contactEmail: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}
