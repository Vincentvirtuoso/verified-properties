export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  cta: string;
  price: number;
  propertyType: "apartment" | "house" | "townhouse" | "condo" | "land";
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  location: string;
  listingType: "sale" | "rent";
  impressions: number;
  clicks: number;
  ctr: number;
  status: "active" | "paused" | "sold" | "rented";
  createdAt: Date;
}

export const dummyAds: Ad[] = [
  {
    id: "re_001",
    title: "Luxury 3BR Penthouse with Skyline View",
    description:
      "Floor‑to‑ceiling windows, private rooftop terrace, and smart home features.",
    imageUrl: "https://picsum.photos/id/106/300/200",
    linkUrl: "/properties/penthouse-123",
    cta: "View Details",
    price: 1250000,
    propertyType: "condo",
    bedrooms: 3,
    bathrooms: 2.5,
    areaSqFt: 2150,
    location: "Downtown, Austin, TX",
    listingType: "sale",
    impressions: 8700,
    clicks: 410,
    ctr: 4.71,
    status: "active",
    createdAt: new Date("2025-06-01T09:00:00Z"),
  },
  {
    id: "re_002",
    title: "Cozy 2BR Family Home Near Parks & Schools",
    description:
      "Newly renovated kitchen, fenced backyard, and quiet cul‑de‑sac.",
    imageUrl: "https://picsum.photos/id/169/300/200",
    linkUrl: "/properties/family-home-456",
    cta: "Schedule Tour",
    price: 525000,
    propertyType: "house",
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1450,
    location: "Westside, Portland, OR",
    listingType: "sale",
    impressions: 5200,
    clicks: 290,
    ctr: 5.58,
    status: "active",
    createdAt: new Date("2025-06-10T11:30:00Z"),
  },
  {
    id: "re_003",
    title: "Modern Studio Apartment – 1 Block from Subway",
    description:
      "Fully furnished, gym & co‑working space included, utilities covered.",
    imageUrl: "https://picsum.photos/id/20/300/200",
    linkUrl: "/rentalies/studio-789",
    cta: "Check Availability",
    price: 2100,
    propertyType: "apartment",
    bedrooms: 0,
    bathrooms: 1,
    areaSqFt: 550,
    location: "Midtown, Manhattan, NY",
    listingType: "rent",
    impressions: 12300,
    clicks: 980,
    ctr: 7.97,
    status: "active",
    createdAt: new Date("2025-06-05T14:15:00Z"),
  },
  {
    id: "re_004",
    title: "Spacious 4BR Townhouse with Garage & Patio",
    description:
      "Two‑story layout, hardwood floors, and walking distance to shopping.",
    imageUrl: "https://picsum.photos/id/177/300/200",
    linkUrl: "/properties/townhouse-101",
    cta: "Get More Info",
    price: 689000,
    propertyType: "townhouse",
    bedrooms: 4,
    bathrooms: 3,
    areaSqFt: 2250,
    location: "Northbrook, Chicago, IL",
    listingType: "sale",
    impressions: 4100,
    clicks: 130,
    ctr: 3.17,
    status: "paused",
    createdAt: new Date("2025-05-28T08:45:00Z"),
  },
  {
    id: "re_005",
    title: "Luxury Rental – Oceanfront 3BR with Pool",
    description:
      "Direct beach access, resort amenities, and panoramic ocean views.",
    imageUrl: "https://picsum.photos/id/104/300/200",
    linkUrl: "/rentalies/oceanfront-202",
    cta: "View Listing",
    price: 4800,
    propertyType: "condo",
    bedrooms: 3,
    bathrooms: 2,
    areaSqFt: 1780,
    location: "Malibu, CA",
    listingType: "rent",
    impressions: 9800,
    clicks: 720,
    ctr: 7.35,
    status: "rented",
    createdAt: new Date("2025-05-15T12:00:00Z"),
  },
  {
    id: "re_006",
    title: "Vacant Land – Build Your Dream Home",
    description: "0.8 acre lot with utilities at the lot line, no HOA.",
    imageUrl: "https://picsum.photos/id/15/300/200",
    linkUrl: "/lanies/woodland-acres",
    cta: "See Lot Details",
    price: 120000,
    propertyType: "land",
    bedrooms: 0,
    bathrooms: 0,
    areaSqFt: 34848,
    location: "Hillsboro, OR",
    listingType: "sale",
    impressions: 2700,
    clicks: 95,
    ctr: 3.52,
    status: "active",
    createdAt: new Date("2025-06-12T09:20:00Z"),
  },
];
