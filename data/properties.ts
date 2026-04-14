import { type Property } from "@/types/property";

export const properties: Property[] = [
  {
    _id: "prop_001",
    title: "4 Bedroom Terraced Duplex for Rent at Gaduwa Abuja",
    description:
      "Spacious modern terraced duplex with premium finishing, ample parking space, and 24/7 security.",
    location:
      "By Mobil Filling Station, Off Lokogoma Road, Gaduwa District, Abuja",
    price: 6000000,
    type: "Terraced Duplex",
    bedrooms: 4,
    bathrooms: 5,
    area: 320,
    listingType: "rent",
    status: "available",

    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      },
      {
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      },
    ],

    agent: {
      id: "agent_001",
      name: "Eyitayo Olowoloba",
      phone: "+2348012345678",
      email: "eyitayo@example.com",
      company: "Prime Estates Ltd",
      verified: true,
      image: "https://i.pravatar.cc/150?img=12",
    },

    isFeatured: true,
    sponsored: true,

    discount: {
      percentage: 10,
    },
    createdAt: "2026-04-12T10:00:00Z",
  },

  {
    _id: "prop_002",
    title: "2 Bedroom Event Center for Rent",
    description:
      "Well-equipped event space suitable for small gatherings, meetings, and celebrations.",
    location: "Asokoro, Municipal Area Council, Abuja",
    price: 6000000,
    type: "Event Center",
    bedrooms: 2,
    bathrooms: 2,
    area: 200,
    listingType: "rent",
    status: "available",

    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",

    agent: {
      id: "agent_002",
      name: "James Bond",
      phone: "+2348098765432",
      verified: false,
      image: "https://i.pravatar.cc/150?img=22",
    },

    isFeatured: true,
    createdAt: "2026-03-29T14:00:00Z",
  },

  {
    _id: "prop_003",
    title: "Luxury 4 Bedroom House for Sale at Maitama",
    description:
      "Elegant luxury home in a prime location with state-of-the-art facilities and serene environment.",
    location: "Maitama, Abuja",
    price: 900000000,
    type: "House",
    bedrooms: 4,
    bathrooms: 5,
    area: 500,
    listingType: "sale",
    status: "available",

    image:
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&h=600&fit=crop",

    gallery: [
      {
        url: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800",
      },
      {
        url: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800",
      },
    ],

    agent: {
      id: "agent_003",
      name: "Genesis Solos",
      company: "Luxury Homes NG",
      verified: true,
      image: "https://i.pravatar.cc/150?img=30",
    },

    isFeatured: true,
    createdAt: "2026-02-10T09:00:00Z",
  },

  {
    _id: "prop_004",
    title: "5 Bedroom Semi-Detached Duplex for Rent at Katampe",
    description:
      "Modern semi-detached duplex with spacious rooms, fitted kitchen, and excellent road access.",
    location: "Patrick Yakowa St, Gwarinpa, Abuja",
    price: 12000000,
    type: "Semi-Detached Duplex",
    bedrooms: 5,
    bathrooms: 6,
    area: 400,
    listingType: "rent",
    status: "available",

    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop",

    agent: {
      id: "agent_001",
      name: "Eyitayo Olowoloba",
      company: "Prime Estates Ltd",
      verified: true,
      image: "https://i.pravatar.cc/150?img=12",
    },

    isFeatured: true,
    createdAt: "2026-04-13T08:00:00Z",
  },
];
