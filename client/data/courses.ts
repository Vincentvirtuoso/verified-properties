import type { Course, Podcast } from "@/types";

export const MOCK_COURSES: Course[] = [
  {
    id: "course-1",
    type: "mixed",
    thumbnail: "/courses/course-1.jpg",
    title: "Lagos: Blueprint for a Megacity - Insider Investor Guide",
    description:
      "Complete guide to Lagos real estate: What they aren't telling you about property investment, titling, and urban growth in Nigeria's commercial capital.",
    modules: [
      {
        type: "video",
        title: "Lagos Real Estate Market: Why Property Investment is Booming",
        youtubeUrl: "https://www.youtube.com/watch?v=BsygxsalYeM",
        description:
          "Overview of Lagos megacity opportunities and hidden risks.",
        duration: "25:00",
      },
      {
        type: "doc",
        title: "Property Titling Checklist for Lagos",
        content:
          "Key documents: Governor's Consent, C of O, Survey Plan, and common pitfalls in Lagos land deals.",
        description: "Downloadable reference guide.",
      },
    ],
    status: "published",
    difficulty: "intermediate",
    tags: ["Lagos", "Real Estate", "Investment", "Nigeria"],
    slug: "lagos-blueprint-megacity",
    isFeatured: true,
    createdAt: "2026-01-15T10:30:00.000Z",
    updatedAt: "2026-05-20T14:22:00.000Z",
  },

  {
    id: "course-2",
    type: "video",
    title: "Mastering AGIS: The Abuja Property Investor Guide",
    youtubeUrl: "https://www.youtube.com/watch?v=nmUeYeX1MiY",
    description:
      "Step-by-step guide to Abuja Geographic Information Systems (AGIS), land verification, title checks, and zoning for safe investments.",
    duration: "35:00",
    thumbnail: "/courses/course-2.jpg",
    status: "published",
    difficulty: "intermediate",
    tags: ["Abuja", "AGIS", "Property Verification", "FCTA"],
    slug: "mastering-agis-abuja",
    isFeatured: true,
    createdAt: "2026-02-03T09:00:00.000Z",
    updatedAt: "2026-05-18T17:05:00.000Z",
  },

  {
    id: "course-3",
    type: "video",
    title: "Governor’s Consent in Nigeria: What They Aren’t Telling You",
    youtubeUrl: "https://www.youtube.com/watch?v=0P2JV6H9XRw",
    description:
      "How property titling works – C of O, Deed of Assignment, Survey, Governor’s Consent process, approvals, and risks.",
    duration: "40:00",
    thumbnail: "/courses/course-3.jpg",
    status: "published",
    difficulty: "beginner",
    tags: ["GovernorConsent", "LandTitling", "NigeriaRealEstate"],
    slug: "governors-consent-guide",
    isFeatured: false,
    createdAt: "2026-03-20T11:00:00.000Z",
    updatedAt: "2026-05-19T08:15:00.000Z",
  },

  {
    id: "course-4",
    type: "mixed",
    title: "Tenant Eviction in Nigeria: Complete Landlord Guide",
    thumbnail: "/courses/course-4.jpg",
    description:
      "Practical series on legal tenant eviction processes, rights, notices, court procedures, and avoiding costly mistakes.",
    modules: [
      {
        type: "video",
        title: "Tenant Eviction Nigeria - Part 1: Landlord Rights & Procedures",
        youtubeUrl: "https://www.youtube.com/watch?v=Ot92dK6Ct74",
        description: "Basics every landlord must know.",
        duration: "28:00",
      },
      {
        type: "video",
        title:
          "Tenant Eviction Nigeria - Part 2: Common Pitfalls & Court Cases",
        youtubeUrl: "https://www.youtube.com/watch?v=Ot92dK6Ct74",
        description: "Real cases and strategies.",
        duration: "32:00",
      },
      {
        type: "video",
        title: "Tenant Eviction Nigeria - Part 3: Advanced Tactics",
        youtubeUrl: "https://www.youtube.com/watch?v=kHLht1tcwrg",
        description: "What property owners must pay or risk losing land.",
        duration: "30:00",
      },
    ],
    status: "published",
    difficulty: "intermediate",
    tags: ["TenantEviction", "LandlordGuide", "NigeriaLaw"],
    slug: "tenant-eviction-nigeria-series",
    isFeatured: true,
    createdAt: "2026-04-10T13:45:00.000Z",
    updatedAt: "2026-05-21T07:30:00.000Z",
  },

  {
    id: "course-5",
    type: "video",
    thumbnail: "/courses/course-5.jpg",
    title:
      "The Shocking Truth About Inherited Property in Nigeria: Who Really Owns It?",
    youtubeUrl: "https://www.youtube.com/watch?v=M1gOt17KOe8",
    description:
      "Legal steps to claim, transfer, and avoid family land disputes on inherited properties.",
    duration: "45:00",
    status: "published",
    difficulty: "advanced",
    tags: ["InheritedProperty", "LandDisputes", "Succession"],
    slug: "inherited-property-nigeria",
    isFeatured: false,
    createdAt: "2026-05-01T16:00:00.000Z",
    updatedAt: "2026-05-20T12:10:00.000Z",
  },
];

export const MOCK_PODCASTS: Podcast[] = [
  {
    id: "p1",
    title: "Land Banking Strategies",
    host: "Chidi Okonkwo",
    duration: "42 min",
    description:
      "Innovative ways to acquire land with zero capital using JV structures. Real case studies and expert interviews.",
    thumbnail: "/podcasts/land-banking.jpg",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    episode: 1,
  },
  {
    id: "p2",
    title: "Legal Pitfalls in JV Contracts",
    host: "Amara Eze",
    duration: "38 min",
    description:
      "Avoiding common mistakes in JV contracts and due diligence. Key clauses to protect your investment.",
    thumbnail: "/podcasts/legal-pitfalls.jpg",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    episode: 2,
  },
  {
    id: "p3",
    title: "Scaling with Investors",
    host: "Chidi Okonkwo",
    duration: "55 min",
    description:
      "How to structure deals to attract multiple investors while maintaining control and profitability.",
    thumbnail: "/podcasts/scaling.jpg",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    episode: 3,
  },
  {
    id: "p4",
    title: "Market Trends 2026",
    host: "Ngozi Adebayo",
    duration: "28 min",
    description:
      "Analysis of the latest real estate market trends in Nigeria and emerging opportunities.",
    thumbnail: "/podcasts/market-trends.jpg",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    episode: 4,
  },
];
