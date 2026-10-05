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
  propertySlug: string;
}


export const dummyAds: Ad[] = [
  {
    id: "re_001",
    propertySlug: "luxury-penthouse-apartment-ikoyi",
    title: "3 Bedroom Waterfront Penthouse Apartment",
    description:
      "Overlooking the Lagos lagoon — wrap-around balconies, high ceilings, and home-automated appliances in the heart of Ikoyi.",
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
    linkUrl: "/properties/luxury-penthouse-apartment-ikoyi",
    cta: "View Details",
    price: 28000000,
    propertyType: "condo",
    bedrooms: 3,
    bathrooms: 4,
    areaSqFt: 4306, 
    location: "Ikoyi, Lagos",
    listingType: "rent",
    impressions: 8700,
    clicks: 410,
    ctr: 4.71,
    status: "active",
    createdAt: new Date("2025-06-01T09:00:00Z"),
  },
  {
    id: "re_002",
    propertySlug: "smart-4-bedroom-semi-detached-duplex-chevron",
    title: "Smart 4 Bedroom Semi-Detached Duplex",
    description:
      "Google Home voice automation, solar inverter backup, open plan layout, and bore-hole treatment — off Chevron Alternative Route.",
    imageUrl: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b",
    linkUrl: "/properties/smart-4-bedroom-semi-detached-duplex-chevron",
    cta: "Schedule Tour",
    price: 165000000,
    propertyType: "house",
    bedrooms: 4,
    bathrooms: 5,
    areaSqFt: 3014, 
    location: "Lekki, Lagos",
    listingType: "sale",
    impressions: 5200,
    clicks: 290,
    ctr: 5.58,
    status: "active",
    createdAt: new Date("2025-06-10T11:30:00Z"),
  },
  {
    id: "re_003",
    propertySlug: "3-bedroom-serviced-apartment-yaba",
    title: "Modern 3 Bedroom Serviced Apartment",
    description:
      "Fully serviced in the tech-hub of Yaba — 24/7 power, uniform security, and furnished. Ideal for young professionals.",
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
    linkUrl: "/properties/3-bedroom-serviced-apartment-yaba",
    cta: "Check Availability",
    price: 4500000,
    propertyType: "apartment",
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 1938, 
    location: "Yaba, Lagos",
    listingType: "rent",
    impressions: 12300,
    clicks: 980,
    ctr: 7.97,
    status: "active",
    createdAt: new Date("2025-06-05T14:15:00Z"),
  },
  {
    id: "re_004",
    propertySlug: "4-bedroom-terrace-duplex-wuse-2",
    title: "Exquisite 4 Bedroom Terrace Duplex",
    description:
      "Fully automated luxury terrace in Wuse 2 — private BQ, pent rooftop view, and pre-installed smart switches.",
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    linkUrl: "/properties/4-bedroom-terrace-duplex-wuse-2",
    cta: "Get More Info",
    price: 320000000,
    propertyType: "townhouse",
    bedrooms: 4,
    bathrooms: 5,
    areaSqFt: 3337, 
    location: "Wuse 2, Abuja",
    listingType: "sale",
    impressions: 4100,
    clicks: 130,
    ctr: 3.17,
    status: "paused",
    createdAt: new Date("2025-05-28T08:45:00Z"),
  },
  {
    id: "re_005",
    propertySlug: "garden-duplex-estate-banana-island",
    title: "Exquisite 5 Bedroom Garden Duplex — Banana Island",
    description:
      "Custom-built semi-detached with a manicured private botanical garden and wrap-around recreational facilities.",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
    linkUrl: "/properties/garden-duplex-estate-banana-island",
    cta: "View Listing",
    price: 950000000,
    propertyType: "house",
    bedrooms: 5,
    bathrooms: 6,
    areaSqFt: 5597, 
    location: "Banana Island, Lagos",
    listingType: "sale",
    impressions: 9800,
    clicks: 720,
    ctr: 7.35,
    status: "active",
    createdAt: new Date("2025-05-15T12:00:00Z"),
  },
  {
    id: "re_006",
    propertySlug: "gated-estate-residential-land-epe",
    title: "100% Dry Residential Land (600 sqm)",
    description:
      "Ready-to-build premium dry land inside a secure luxury estate — clean documentation, zero allocation issues.",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
    linkUrl: "/properties/gated-estate-residential-land-epe",
    cta: "See Lot Details",
    price: 22000000,
    propertyType: "land",
    bedrooms: 0,
    bathrooms: 0,
    areaSqFt: 6458, 
    location: "Epe, Lagos",
    listingType: "sale",
    impressions: 2700,
    clicks: 95,
    ctr: 3.52,
    status: "active",
    createdAt: new Date("2025-06-12T09:20:00Z"),
  },
];
