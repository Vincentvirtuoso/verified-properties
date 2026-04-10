export type ListingType = "Rent" | "Sale";

export type Property = {
  _id: string;
  title: string;
  location: string;
  price: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area?: string;
  listingType: ListingType;
  sponsored?: boolean;
  agent?: string;
  timeAgo?: string;
  image?: string;
};
