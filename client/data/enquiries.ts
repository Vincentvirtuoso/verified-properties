import { Enquiry } from "@/types/enquiry";
import { Company, PopulatedUser } from "@/types";
import { dummyUsers } from "./users";
import { mockCompanies } from "./companies";

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const daysAgo = (d: number) =>
  new Date(now.getTime() - d * 24 * 60 * 60 * 1000);



const userById = new Map<string, PopulatedUser>(
  dummyUsers.map((u) => [u._id, u]),
);
const companyById = new Map<string, Company>(
  mockCompanies.map((c) => [c._id, c]),
);

function user(id: string): PopulatedUser {
  const u = userById.get(id);
  if (!u) throw new Error(`Enquiry references unknown user: ${id}`);
  return u;
}

function company(id: string): Company {
  const c = companyById.get(id);
  if (!c) throw new Error(`Enquiry references unknown company: ${id}`);
  return c;
}



function buyer(id: string) {
  const u = user(id);
  return {
    buyerId: u._id,
    buyerName: u.name,
    buyerAvatar: u.avatar,
    buyerEmail: u.email,
    buyerPhone: u.phone,
  };
}

function agentUser(id: string) {
  const u = user(id);
  return {
    agentId: u._id,
    agentName: u.name,
    agentAvatar: u.avatar ?? u.agentProfile?.logo,
    agentType: "user" as const,
    agentSubRole: u.agentProfile?.subRole,
    agentVerificationStatus: u.agentProfile?.verificationStatus,
    contactUserId: u._id,
  };
}

function agentCompany(companyId: string, contactUserId?: string) {
  const c = company(companyId);
  const contact = contactUserId ? user(contactUserId) : undefined;

  return {
    agentId: c._id,
    agentName: c.name,
    agentAvatar: c.logo,
    agentType: "company" as const,
    companyId: c._id,
    companyName: c.name,
    companySlug: c.slug,
    contactUserId: contact?._id,
    contactUserName: contact?.name,
  };
}



export const mockEnquiries: Enquiry[] = [
  {
    id: "enq_001",
    propertyId: "prop_101",
    propertyTitle: "3-Bed Duplex, Lekki Phase 1",
    propertyImage: "/properties/lekki-duplex-1.jpg",
    ...buyer("user_001"),
    ...agentUser("user_003"),
    stage: "inspection",
    lastEventPreview: "Assistant: Inspection confirmed for Thursday 10am",
    lastEventAt: hoursAgo(2),
    unreadCount: 1,
    events: [
      {
        type: "message",
        id: "m1",
        sender: "buyer",
        text: 'Hi, I\'m interested in "3-Bed Duplex, Lekki Phase 1". Please contact me.',
        timestamp: daysAgo(3),
      },
      {
        type: "call",
        id: "c1",
        caller: "assistant",
        durationSeconds: 184,
        outcome: "answered",
        summary:
          "Buyer confirmed budget of ₦85M–₦100M, looking to move within 2 months. Interested in proceeding to inspection.",
        transcript:
          "Assistant: Hi Femi, I'm calling about your enquiry on the Lekki Phase 1 duplex...\nFemi: Yes, I saw it on the site. Is it still available?\nAssistant: It is. Can I ask your budget range and timeline?\nFemi: Around 85 to 100 million, hoping to move in the next couple of months.\nAssistant: Great, I'll let the agent know and we can get a viewing scheduled.",
        timestamp: daysAgo(3),
      },
      {
        type: "message",
        id: "m2",
        sender: "agent",
        text: "Hi Femi, thanks for your interest! I can do a viewing this week — would Thursday 10am work?",
        timestamp: daysAgo(1),
      },
      {
        type: "message",
        id: "m3",
        sender: "buyer",
        text: "Thursday 10am works for me, thank you!",
        timestamp: daysAgo(1),
      },
      {
        type: "call",
        id: "c2",
        caller: "assistant",
        durationSeconds: 46,
        outcome: "answered",
        summary: "Inspection confirmed for Thursday 10am. Reminder scheduled.",
        timestamp: hoursAgo(2),
      },
    ],
  },

  {
    id: "enq_002",
    propertyId: "prop_102",
    propertyTitle: "2-Bed Apartment, Ikoyi",
    propertyImage: "/properties/ikoyi-apartment-1.jpg",
    ...buyer("user_002"),
    ...agentCompany("company-3", "user_008"),
    stage: "qualification",
    lastEventPreview: "Assistant call — missed",
    lastEventAt: daysAgo(1),
    unreadCount: 0,
    events: [
      {
        type: "message",
        id: "m4",
        sender: "buyer",
        text: 'Hi, I\'m interested in "2-Bed Apartment, Ikoyi". Please contact me.',
        timestamp: daysAgo(1),
      },
      {
        type: "call",
        id: "c3",
        caller: "assistant",
        durationSeconds: 0,
        outcome: "missed",
        timestamp: daysAgo(1),
      },
    ],
  },

  {
    id: "enq_003",
    propertyId: "prop_101",
    propertyTitle: "3-Bed Duplex, Lekki Phase 1",
    propertyImage: "/properties/lekki-duplex-1.jpg",
    ...buyer("user_010"),
    ...agentUser("user_005"),
    stage: "selection",
    lastEventPreview: "Blessing: Does it come with the furniture shown?",
    lastEventAt: hoursAgo(5),
    unreadCount: 2,
    events: [
      {
        type: "message",
        id: "m5",
        sender: "buyer",
        text: 'Hi, I\'m interested in "3-Bed Duplex, Lekki Phase 1". Please contact me.',
        timestamp: hoursAgo(8),
      },
      {
        type: "call",
        id: "c4",
        caller: "assistant",
        durationSeconds: 97,
        outcome: "answered",
        summary:
          "Buyer qualified: budget ₦120M, cash buyer, flexible timeline. Asked about furnishing.",
        timestamp: hoursAgo(8),
      },
      {
        type: "message",
        id: "m6",
        sender: "buyer",
        text: "Does it come with the furniture shown in the photos?",
        timestamp: hoursAgo(5),
      },
    ],
  },

  {
    id: "enq_004",
    propertyId: "prop_110",
    propertyTitle: "4-Bed Terrace, Gbagada",
    propertyImage: "/properties/gbagada-terrace-1.jpg",
    ...buyer("user_001"),
    ...agentCompany("company-6"),
    stage: "inspection",
    lastEventPreview: "Agent: Viewing booked for Saturday 2pm",
    lastEventAt: hoursAgo(6),
    unreadCount: 0,
    events: [
      {
        type: "message",
        id: "m7",
        sender: "buyer",
        text: 'Hi, I\'m interested in "4-Bed Terrace, Gbagada". Please contact me.',
        timestamp: daysAgo(2),
      },
      {
        type: "call",
        id: "c5",
        caller: "assistant",
        durationSeconds: 132,
        outcome: "answered",
        summary:
          "Buyer pre-qualified: ₦95M budget, mortgage pre-approved, ready to view this weekend.",
        timestamp: daysAgo(2),
      },
      {
        type: "message",
        id: "m8",
        sender: "agent",
        text: "Viewing booked for Saturday 2pm — our team will meet you at the gate.",
        timestamp: hoursAgo(6),
      },
    ],
  },

  {
    id: "enq_005",
    propertyId: "prop_108",
    propertyTitle: "3-Bed Serviced Apartment, Yaba",
    propertyImage: "/properties/yaba-serviced-1.jpg",
    ...buyer("user_002"),
    ...agentUser("user_004"),
    stage: "qualification",
    lastEventPreview: "Assistant: Voicemail left, awaiting callback",
    lastEventAt: hoursAgo(14),
    unreadCount: 0,
    events: [
      {
        type: "message",
        id: "m9",
        sender: "buyer",
        text: 'Hi, I\'m interested in "3-Bed Serviced Apartment, Yaba". Please contact me.',
        timestamp: hoursAgo(20),
      },
      {
        type: "call",
        id: "c6",
        caller: "assistant",
        durationSeconds: 0,
        outcome: "missed",
        summary: "Voicemail left. Awaiting buyer callback.",
        timestamp: hoursAgo(14),
      },
    ],
  },
  {
    id: "enq_006",
    propertyId: "prop_115",
    propertyTitle: "5-Bed Detached Duplex, Ikeja GRA",
    propertyImage: "/properties/ikeja-gra-duplex-1.jpg",
    ...buyer("user_010"),
    ...agentCompany("company-4", "user_008"),
    stage: "inspection",
    lastEventPreview:
      "Agent: Offer of ₦185M received — awaiting seller response",
    lastEventAt: hoursAgo(1),
    unreadCount: 3,
    events: [
      {
        type: "message",
        id: "m10",
        sender: "buyer",
        text: 'Hi, I\'m interested in "5-Bed Detached Duplex, Ikeja GRA". Please contact me.',
        timestamp: daysAgo(6),
      },
      {
        type: "call",
        id: "c7",
        caller: "assistant",
        durationSeconds: 214,
        outcome: "answered",
        summary:
          "Buyer qualified: ₦180M–₦200M range, chain-free, wants to close within 30 days. Requested comparables for the street.",
        transcript:
          "Assistant: Hi Blessing, following up on your Ikeja GRA enquiry...\nBlessing: Yes, we're serious about it. We've sold our Gbagada place already, so we're chain-free.\nAssistant: Great — what offer range are you considering?\nBlessing: Around 180 to 200, depending on the condition and any recent comparables.\nAssistant: Understood, I'll have the agent send over recent sales on the street.",
        timestamp: daysAgo(5),
      },
      {
        type: "message",
        id: "m11",
        sender: "agent",
        text: "Sent you comparables for the last 3 sales on the street. Happy to walk you through them tomorrow.",
        timestamp: daysAgo(3),
      },
      {
        type: "message",
        id: "m12",
        sender: "buyer",
        text: "Reviewed — we'd like to make an offer of ₦185M subject to a satisfactory survey.",
        timestamp: hoursAgo(20),
      },
      {
        type: "message",
        id: "m13",
        sender: "agent",
        text: "Offer of ₦185M received — awaiting seller response.",
        timestamp: hoursAgo(1),
      },
    ],
  },

 
  {
    id: "enq_007",
    propertyId: "prop_121",
    propertyTitle: "2-Bed Off-Plan Apartment, Lekki Phase 2",
    propertyImage: "/properties/lekki-phase2-offplan-1.jpg",
    ...buyer("user_002"),
    ...agentCompany("company-1", "user_007"),
    stage: "qualification",
    lastEventPreview: "Assistant: Payment plan PDF shared via WhatsApp",
    lastEventAt: hoursAgo(9),
    unreadCount: 1,
    events: [
      {
        type: "message",
        id: "m14",
        sender: "buyer",
        text: 'Hi, I\'m interested in "2-Bed Off-Plan Apartment, Lekki Phase 2". Please contact me.',
        timestamp: daysAgo(2),
      },
      {
        type: "call",
        id: "c8",
        caller: "assistant",
        durationSeconds: 158,
        outcome: "answered",
        summary:
          "Buyer exploring off-plan: wants 12–18 month payment plan, asked about C of O status and delivery timeline.",
        timestamp: daysAgo(2),
      },
      {
        type: "message",
        id: "m15",
        sender: "agent",
        text: "Payment plan PDF shared via WhatsApp — includes C of O status and delivery milestones.",
        timestamp: hoursAgo(9),
      },
    ],
  },

 
 
  {
    id: "enq_008",
    propertyId: "prop_118",
    propertyTitle: "Mini Flat, Surulere",
    propertyImage: "/properties/surulere-miniflat-1.jpg",
    ...buyer("user_001"),
    ...agentUser("user_006"),
    stage: "qualification",
    lastEventPreview:
      "Assistant: Left voicemail — landlord hasn't confirmed availability",
    lastEventAt: hoursAgo(3),
    unreadCount: 0,
    events: [
      {
        type: "message",
        id: "m16",
        sender: "buyer",
        text: 'Hi, I\'m interested in "Mini Flat, Surulere". Please contact me.',
        timestamp: daysAgo(1),
      },
      {
        type: "call",
        id: "c9",
        caller: "assistant",
        durationSeconds: 0,
        outcome: "missed",
        summary: "Left voicemail. Landlord hasn't confirmed availability.",
        timestamp: hoursAgo(3),
      },
    ],
  },

 
 
  {
    id: "enq_009",
    propertyId: "prop_127",
    propertyTitle: "Studio Apartment, Yaba",
    propertyImage: "/properties/yaba-studio-1.jpg",
    ...buyer("user_010"),
    ...agentUser("user_004"),
    stage: "selection",
    lastEventPreview: "Blessing: Is the ₦18M negotiable at all?",
    lastEventAt: hoursAgo(4),
    unreadCount: 1,
    events: [
      {
        type: "message",
        id: "m17",
        sender: "buyer",
        text: 'Hi, I\'m interested in "Studio Apartment, Yaba". Please contact me.',
        timestamp: hoursAgo(10),
      },
      {
        type: "call",
        id: "c10",
        caller: "assistant",
        durationSeconds: 64,
        outcome: "answered",
        summary:
          "Buyer asked about price flexibility and utility costs. Small budget — under ₦20M all-in.",
        timestamp: hoursAgo(10),
      },
      {
        type: "message",
        id: "m18",
        sender: "buyer",
        text: "Is the ₦18M negotiable at all?",
        timestamp: hoursAgo(4),
      },
    ],
  },

 
  {
    id: "enq_010",
    propertyId: "prop_104",
    propertyTitle: "3-Bed Bungalow, Magodo Phase 2",
    propertyImage: "/properties/magodo-bungalow-1.jpg",
    ...buyer("user_002"),
    ...agentCompany("company-2", "user_009"),
    stage: "inspection",
    lastEventPreview: "Agent: Inspection confirmed for Sunday 11am",
    lastEventAt: hoursAgo(18),
    unreadCount: 0,
    events: [
      {
        type: "message",
        id: "m19",
        sender: "buyer",
        text: 'Hi, I\'m interested in "3-Bed Bungalow, Magodo Phase 2". Please contact me.',
        timestamp: daysAgo(4),
      },
      {
        type: "call",
        id: "c11",
        caller: "assistant",
        durationSeconds: 121,
        outcome: "answered",
        summary:
          "Buyer qualified: ₦95M budget, prefers a quiet street, wants to view this weekend.",
        timestamp: daysAgo(4),
      },
      {
        type: "message",
        id: "m20",
        sender: "agent",
        text: "Inspection confirmed for Sunday 11am — our agent will meet you on site.",
        timestamp: hoursAgo(18),
      },
    ],
  },
];
