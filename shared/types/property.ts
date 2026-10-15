import {
  PropertyCategory,
  PropertyDocumentType,
  PropertyFeature,
  PropertyType,
} from "./property.sub";
import { PopulatedUser } from "./user";

export type ListingTier = "featured" | "standard";

export type ListingPurpose = "rent" | "sale";

export type PropertyLocation = {
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
};

export type PropertyStatus =
  | "draft"
  | "active"
  | "sold"
  | "rented"
  | "inactive";

export type PropertyImage = {
  url: string;
  alt?: string;
};

export type PropertyDocument = {
  id?: string;
  type: PropertyDocumentType;
  title?: string;
  fileUrl: string;
  uploadedAt?: string;
  reviewStatus?: "pending" | "approved" | "rejected" | "more_info";
  reviewNote?: string;
};

export type PropertyOwnerType = "agent" | "company";

export type Property<Populated extends boolean = false> = {
  _id: string;
  slug: string;
  title: string;
  description?: string;

  category: PropertyCategory;
  type: PropertyType;
  features?: PropertyFeature[];

  ownerId: Populated extends true ? PopulatedUser : string;
  ownerType: PropertyOwnerType;

  tier: ListingTier;

  activeBoostId?: string;

  listingPurpose: ListingPurpose;
  status: PropertyStatus;

  price: number;
  currency: string | "NGN";

  negotiable?: boolean;

  discount?: {
    amount?: number;
    percentage?: number;
  };

  location: PropertyLocation;

  bedrooms: number;
  bathrooms: number;
  area: number;

  image?: string;
  gallery?: PropertyImage[];
  videoLinks?: string[];
  /** Admin review state (013). */
  reviewStatus?:
    | "none"
    | "pending"
    | "approved"
    | "rejected"
    | "changes_requested";
  reviewNote?: string;
  documents?: PropertyDocument[];

  totalInquiries: number;
  totalClosedDeals: number;

  createdAt?: string;
  updatedAt?: string;
};

export type PopulatedProperty = Property<true>;

export type SavedProperty = PopulatedProperty & {
  savedAt: string;
};

export const listingPurposeLabels: Record<ListingPurpose, string> = {
  rent: "For Rent",
  sale: "For Sale",
};
