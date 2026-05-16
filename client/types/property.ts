import { PopulatedUser } from "./user";

export type ListingTier = "featured" | "standard";

export type ListingPurpose = "rent" | "sale";

export type PropertyCategory =
  | "residential"
  | "commercial"
  | "industrial"
  | "land"
  | "mixedUse"
  | "hospitality"
  | "institutional";

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

export type PropertyType =
  | "singleFamilyHouse"
  | "apartment"
  | "terrace"
  | "detachedDuplex"
  | "semiDetachedDuplex"
  | "terraceDuplex"
  | "duplexWithBQ"
  | "duplexWithPenthouse"
  | "duplexVilla"
  | "duplexMaisonette"
  | "gardenDuplex"
  | "smartDuplex"
  | "studentHostel"
  | "servicedApartment"
  | "officeSpace"
  | "retailShop"
  | "warehouse"
  | "hotel"
  | "factory"
  | "industrialPark"
  | "coldStorage"
  | "residentialLand"
  | "commercialLand"
  | "agriculturalLand"
  | "mixedUseLand"
  | "mixedUseDevelopment"
  | "resortAndEventCenter"
  | "schoolOrHospital";

export type PropertyFeature =
  | "boysQuarters"
  | "penthouse"
  | "garden"
  | "smartHome"
  | "furnished"
  | "serviced";

export type PropertyStatus =
  | "draft"
  | "active"
  | "sold"
  | "rented"
  | "inactive";

export type PropertyDocumentType =
  | "certificateOfOccupancy"
  | "governorsConsent"
  | "deedOfAssignment"
  | "deedOfSublease"
  | "deedOfSurrender"
  | "deedOfMortgage"
  | "deedOfGift"
  | "deedOfLease"
  | "deedOfConveyance"
  | "surveyPlan"
  | "approvedBuildingPlan"
  | "excisionDocument"
  | "gazette"
  | "letterOfAllocation"
  | "receiptOfPaymentForLand"
  | "contractOfSale"
  | "powerOfAttorney"
  | "irrevocablePowerOfAttorney"
  | "affidavitOfLoss"
  | "probateLetterOfAdministration"
  | "landPurchaseAgreement"
  | "taxClearanceCertificate"
  | "certificateOfStatutoryRightOfOccupancy"
  | "registeredSurveyPlan";

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
};

export type PropertyOwnerType = "agent" | "landlord" | "company";

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
  currency: string;
  negotiable?: boolean;

  discount?: {
    amount?: number;
    percentage?: number;
  };

  location: PropertyLocation;

  bedrooms: number;
  bathrooms: number;
  area?: number;

  image?: string;
  gallery?: PropertyImage[];
  videoLinks?: string[];
  documents?: PropertyDocument[];

  totalInquiries: number;
  totalClosedDeals: number;

  createdAt?: string;
  updatedAt?: string;
};

export type PopulatedProperty = Property<true>;
