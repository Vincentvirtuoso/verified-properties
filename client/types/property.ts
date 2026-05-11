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
  listingType: ListingType;
  status?: PropertyStatus;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  image?: string;
  gallery?: PropertyImage[];
  agent?: Agent;
  isFeatured?: boolean;
  sponsored?: boolean;
  discount?: {
    amount?: number;
    percentage?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};
