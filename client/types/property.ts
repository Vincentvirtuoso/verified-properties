export type ListingType = "rent" | "sale";

export type PropertyCategory =
  | "residential"
  | "commercial"
  | "industrial"
  | "land"
  | "mixedUse"
  | "hospitality"
  | "institutional";

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

export type PropertyStatus = "available" | "sold" | "rented" | "pending";

export type Agent = {
  id: string;
  name: string;
  image?: string;
  phone?: string;
  email?: string;
  company?: string;
  verified?: boolean;
};

export type PropertyImage = {
  url: string;
  alt?: string;
};

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

export type PropertyDocument = {
  id?: string;
  type: PropertyDocumentType;
  title?: string;
  fileUrl: string;
  uploadedAt?: string;
};

export type Property = {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  location: string;
  price: number;
  category: PropertyCategory;
  type: PropertyType;
  features?: PropertyFeature[];

  listedByUserId: string;
  listedUnder: {
    type: "personal" | "company";
    companyId?: string;
  };

  listingType: ListingType;
  status?: PropertyStatus;
  bedrooms: number;
  bathrooms: number;
  area?: number;

  agent?: Agent;

  isFeatured?: boolean;
  sponsored?: boolean;

  discount?: {
    amount?: number;
    percentage?: number;
  };

  image?: string;
  gallery?: PropertyImage[];
  videoLinks?: string[];
  documents?: PropertyDocument[];

  packageTier: "free" | "partnership";

  createdAt?: string;
  updatedAt?: string;
};

export const documentTypeLabels: Record<PropertyDocumentType, string> = {
  certificateOfOccupancy: "Certificate of Occupancy (C of O)",
  governorsConsent: "Governor's Consent",
  deedOfAssignment: "Deed of Assignment",
  deedOfSublease: "Deed of Sublease",
  deedOfSurrender: "Deed of Surrender",
  deedOfMortgage: "Deed of Mortgage",
  deedOfGift: "Deed of Gift",
  deedOfLease: "Deed of Lease",
  deedOfConveyance: "Deed of Conveyance",
  surveyPlan: "Survey Plan",
  approvedBuildingPlan: "Approved Building Plan",
  excisionDocument: "Excision Document",
  gazette: "Gazette",
  letterOfAllocation: "Letter of Allocation",
  receiptOfPaymentForLand: "Receipt of Payment for Land",
  contractOfSale: "Contract of Sale / Agreement of Sale",
  powerOfAttorney: "Power of Attorney",
  irrevocablePowerOfAttorney: "Irrevocable Power of Attorney",
  affidavitOfLoss: "Affidavit of Loss",
  probateLetterOfAdministration: "Probate / Letter of Administration",
  landPurchaseAgreement: "Land Purchase Agreement",
  taxClearanceCertificate: "Tax Clearance Certificate",
  registeredSurveyPlan: "Registered Survey Plan",
  certificateOfStatutoryRightOfOccupancy:
    "Certificate of Statutory Right of Occupancy",
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  singleFamilyHouse: "Single Family House",
  apartment: "Apartment",
  terrace: "Terrace",
  detachedDuplex: "Detached Duplex",
  semiDetachedDuplex: "Semi-Detached Duplex",
  terraceDuplex: "Terrace Duplex",
  duplexWithBQ: "Duplex with BQ",
  duplexWithPenthouse: "Duplex with Penthouse",
  duplexVilla: "Duplex Villa",
  duplexMaisonette: "Duplex Maisonette",
  gardenDuplex: "Garden Duplex",
  smartDuplex: "Smart Duplex",
  studentHostel: "Student Hostel",
  servicedApartment: "Serviced Apartment",
  officeSpace: "Office Space",
  retailShop: "Retail Shop",
  warehouse: "Warehouse",
  hotel: "Hotel",
  factory: "Factory",
  industrialPark: "Industrial Park",
  coldStorage: "Cold Storage",
  residentialLand: "Residential Land",
  commercialLand: "Commercial Land",
  agriculturalLand: "Agricultural Land",
  mixedUseLand: "Mixed Use Land",
  mixedUseDevelopment: "Mixed Use Development",
  resortAndEventCenter: "Resort & Event Center",
  schoolOrHospital: "School / Hospital",
};

export const featureLabels: Record<PropertyFeature, string> = {
  boysQuarters: "Boys' Quarters",
  penthouse: "Penthouse",
  garden: "Garden",
  smartHome: "Smart Home",
  furnished: "Furnished",
  serviced: "Serviced",
};
