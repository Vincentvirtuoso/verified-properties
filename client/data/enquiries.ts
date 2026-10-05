import { Enquiry } from "@/types/enquiry";

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

export const mockEnquiries: Enquiry[] = [
  {
    id: "enq_001",
    propertyId: "prop_101",
    propertyTitle: "3-Bed Duplex, Lekki Phase 1",
    propertyImage: "/properties/lekki-duplex-1.jpg",
    buyerId: "user_004",
    buyerName: "Amaka Obi",
    buyerAvatar: "/avatars/amaka.jpg",
    agentId: "user_agent_1",
    agentName: "Chidi Realtor",
    stage: "inspection",
    lastEventPreview: "Assistant: Inspection confirmed for Thursday 10am",
    lastEventAt: hoursAgo(2),
    unreadCount: 1,
    events: [
      {
        type: "message",
        id: "m1",
        sender: "buyer",
        text: "Hi, I'm interested in \"3-Bed Duplex, Lekki Phase 1\". Please contact me.",
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
          "Assistant: Hi Amaka, I'm calling about your enquiry on the Lekki Phase 1 duplex...\nAmaka: Yes, I saw it on the site. Is it still available?\nAssistant: It is. Can I ask your budget range and timeline?\nAmaka: Around 85 to 100 million, hoping to move in the next couple of months.\nAssistant: Great, I'll let the agent know and we can get a viewing scheduled.",
        timestamp: daysAgo(3),
      },
      {
        type: "message",
        id: "m2",
        sender: "agent",
        text: "Hi Amaka, thanks for your interest! I can do a viewing this week — would Thursday 10am work?",
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
    buyerId: "user_viewer_1",
    buyerName: "Amaka Obi",
    agentId: "user_agent_2",
    agentName: "Verified Properties Ltd",
    stage: "qualification",
    lastEventPreview: "Assistant call — missed",
    lastEventAt: daysAgo(1),
    unreadCount: 0,
    events: [
      {
        type: "message",
        id: "m4",
        sender: "buyer",
        text: "Hi, I'm interested in \"2-Bed Apartment, Ikoyi\". Please contact me.",
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
    buyerId: "user_viewer_2",
    buyerName: "Tunde Bakare",
    agentId: "user_agent_1",
    agentName: "Chidi Realtor",
    stage: "selection",
    lastEventPreview: "Tunde: Does it come with the furniture shown?",
    lastEventAt: hoursAgo(5),
    unreadCount: 2,
    events: [
      {
        type: "message",
        id: "m5",
        sender: "buyer",
        text: "Hi, I'm interested in \"3-Bed Duplex, Lekki Phase 1\". Please contact me.",
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
];