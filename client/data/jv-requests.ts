export type JvStrategy =
  | "equity_partnership"
  | "revenue_share"
  | "co_development"
  | "developer_financed";
export type JvRequestStatus = "open" | "matched" | "closed" | "withdrawn";
export type JvResponseStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "withdrawn";

export const STRATEGY_LABELS: Record<JvStrategy, string> = {
  equity_partnership: "Equity partnership",
  revenue_share: "Revenue share",
  co_development: "Co-development",
  developer_financed: "Developer-financed",
};

export const REQUEST_TYPES = [
  "Land partnership",
  "Project co-funding",
  "Joint development",
  "Other",
] as const;

export interface JvResponseRecord {
  id: string;
  requestId: string;
  subscriberId: string;
  message: string;
  status: JvResponseStatus;
  createdAt: string;
  revealedAt?: string;
}

export interface JvRequestRecord {
  id: string;
  posterId: string;
  area: string;
  requestType: string;
  budgetMin: number;
  budgetMax: number;
  strategyPreference: JvStrategy;
  description: string;
  status: JvRequestStatus;
  createdAt: string;
  updatedAt?: string | null;
  responses: JvResponseRecord[];
}

export interface JvProfile {
  name: string;
  email: string;
  phone: string;
  verified: boolean;
}

export const JV_PROFILES: Record<string, JvProfile> = {
  user_020: {
    name: "Tunde Adeyemi",
    email: "tunde@example.com",
    phone: "+234 801 000 0020",
    verified: true,
  },
  user_031: {
    name: "Chidi Okafor",
    email: "chidi@example.com",
    phone: "+234 802 000 0031",
    verified: false,
  },
  user_007: {
    name: "Ngozi Eze",
    email: "ngozi@example.com",
    phone: "+234 803 000 0007",
    verified: true,
  },
  user_012: {
    name: "Crestline Developments Ltd",
    email: "info@crestline.example",
    phone: "+234 804 000 0012",
    verified: true,
  },
};

export const JV_SUBSCRIPTIONS: Record<
  string,
  { status: "active" | "lapsed"; expiresAt: string }
> = {
  user_007: { status: "active", expiresAt: "2026-11-20T00:00:00Z" },
  user_012: { status: "active", expiresAt: "2026-12-31T00:00:00Z" },
  user_031: { status: "lapsed", expiresAt: "2026-09-30T00:00:00Z" },
};

export const JV_REQUESTS: JvRequestRecord[] = [
  {
    id: "jvr_1",
    posterId: "user_020",
    area: "Lagos, Ibeju-Lekki",
    requestType: "Land partnership",
    budgetMin: 150_000_000,
    budgetMax: 400_000_000,
    strategyPreference: "equity_partnership",
    description:
      "Holds three plots of registered land with a Certificate of Occupancy and wants a developer to build a residential estate on a profit-share basis.",
    status: "open",
    createdAt: "2026-10-18T09:00:00Z",
    responses: [],
  },
  {
    id: "jvr_2",
    posterId: "user_031",
    area: "FCT Abuja, Lugbe",
    requestType: "Project co-funding",
    budgetMin: 80_000_000,
    budgetMax: 150_000_000,
    strategyPreference: "revenue_share",
    description:
      "Looking for co-funding on a small mixed-use block. Land is in hand and the design is ready for approval.",
    status: "open",
    createdAt: "2026-10-19T11:30:00Z",
    responses: [],
  },
  {
    id: "jvr_3",
    posterId: "user_020",
    area: "Ogun, Sagamu",
    requestType: "Joint development",
    budgetMin: 200_000_000,
    budgetMax: 600_000_000,
    strategyPreference: "developer_financed",
    description:
      "Seeking a developer to finance and build a 40-unit scheme on land already secured in Sagamu.",
    status: "matched",
    createdAt: "2026-10-14T08:15:00Z",
    responses: [
      {
        id: "jvres_1",
        requestId: "jvr_3",
        subscriberId: "user_012",
        message: "We have a 40-unit design ready and can fund the first phase.",
        status: "accepted",
        createdAt: "2026-10-16T12:00:00Z",
        revealedAt: "2026-10-17T10:00:00Z",
      },
      {
        id: "jvres_2",
        requestId: "jvr_3",
        subscriberId: "user_007",
        message:
          "Interested in a co-development split. Happy to discuss terms.",
        status: "pending",
        createdAt: "2026-10-17T14:20:00Z",
      },
    ],
  },
  {
    id: "jvr_4",
    posterId: "user_020",
    area: "Oyo, Ibadan",
    requestType: "Land partnership",
    budgetMin: 90_000_000,
    budgetMax: 180_000_000,
    strategyPreference: "revenue_share",
    description:
      "Registered land ready for site works. Looking for a developer to fund works in exchange for a revenue share on sales.",
    status: "closed",
    createdAt: "2026-09-02T10:00:00Z",
    responses: [
      {
        id: "jvres_4",
        requestId: "jvr_4",
        subscriberId: "user_007",
        message: "We can fund site works on a revenue share.",
        status: "accepted",
        createdAt: "2026-09-03T09:00:00Z",
        revealedAt: "2026-09-04T09:00:00Z",
      },
    ],
  },
  {
    id: "jvr_5",
    posterId: "user_020",
    area: "Lagos, Lekki",
    requestType: "Project co-funding",
    budgetMin: 120_000_000,
    budgetMax: 250_000_000,
    strategyPreference: "co_development",
    description:
      "Second phase of a residential scheme needs co-funding. Drawings and approvals are in progress.",
    status: "matched",
    createdAt: "2026-10-01T08:00:00Z",
    responses: [
      {
        id: "jvres_5",
        requestId: "jvr_5",
        subscriberId: "user_031",
        message: "Our team can co-fund the second phase.",
        status: "accepted",
        createdAt: "2026-10-02T09:00:00Z",
        revealedAt: "2026-10-03T09:00:00Z",
      },
    ],
  },
  {
    id: "jvr_6",
    posterId: "user_031",
    area: "Kano, Nassarawa",
    requestType: "Joint development",
    budgetMin: 300_000_000,
    budgetMax: 500_000_000,
    strategyPreference: "developer_financed",
    description:
      "Mixed-use development on secured land. Seeking a developer to deliver under a financed arrangement.",
    status: "matched",
    createdAt: "2026-05-10T10:00:00Z",
    responses: [
      {
        id: "jvres_6",
        requestId: "jvr_6",
        subscriberId: "user_012",
        message: "We can deliver the development under a financed arrangement.",
        status: "accepted",
        createdAt: "2026-05-12T09:00:00Z",
        revealedAt: "2026-05-13T09:00:00Z",
      },
    ],
  },
];

export interface JvThreadMessage {
  id: string;
  senderId: string;
  text: string;
  sentAt: string;
}

export const JV_THREAD_MESSAGES: Record<string, JvThreadMessage[]> = {
  jvres_1: [
    {
      id: "msg_1",
      senderId: "user_020",
      text: "Thanks for accepting. When can we review the 40-unit design?",
      sentAt: "2026-10-18T09:30:00Z",
    },
    {
      id: "msg_2",
      senderId: "user_012",
      text: "We can share the drawings this week. Shall we set up a call on Thursday?",
      sentAt: "2026-10-19T14:10:00Z",
    },
  ],
  jvres_4: [
    {
      id: "msg_3",
      senderId: "user_007",
      text: "Site works can start once the title documents are in.",
      sentAt: "2026-09-10T11:00:00Z",
    },
  ],
  jvres_5: [
    {
      id: "msg_4",
      senderId: "user_020",
      text: "Phase two drawings are on our side. Can you review by Friday?",
      sentAt: "2026-10-15T16:00:00Z",
    },
  ],
  jvres_6: [
    {
      id: "msg_5",
      senderId: "user_031",
      text: "Happy to proceed. Send the financing schedule when ready.",
      sentAt: "2026-06-30T10:00:00Z",
    },
  ],
};
