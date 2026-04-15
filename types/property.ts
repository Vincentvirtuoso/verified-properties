export type ListingType = "rent" | "sale";

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

  type: string;
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
