import {
  PropertyLocation,
  PropertyImage,
  PropertyStatus,
  PropertyCategory,
  PropertyType,
} from "./property";
import { PopulatedUser } from "./user";

export type JVProperty = {
  _id: string;
  slug: string;
  title: string;
  description?: string;

  location: PropertyLocation;
  image?: string;
  gallery?: PropertyImage[];

  price: number;
  currency: string;
  landValue?: number;
  landSize?: string;
  premium?: number;
  minimumInvestment: number;
  roi: number;
  investmentDuration: string;

  sharingFormula?: string;
  facilitatorFee?: {
    totalPercentage: number;
    developerShare: number;
    ownerShare: number;
    negotiable: boolean;
  };

  category?: PropertyCategory;
  type?: PropertyType;
  purposeDescription?: string;

  googlePin?: string;

  totalInvestors?: number;
  maxInvestors?: number;

  status: PropertyStatus;
  propertyId?: string;

  ownerId: PopulatedUser | string;
  ownerType: "agent" | "landlord" | "company";

  createdAt?: string;
  updatedAt?: string;
};
