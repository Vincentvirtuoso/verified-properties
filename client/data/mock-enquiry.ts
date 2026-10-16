import type { Enquiry } from "@affilhomes/shared/types/enquiry";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ago = (ms: number) => new Date(Date.now() - ms);

export async function fetchMockMyEnquiries(
  userId: string,
  isAgentSide: boolean,
): Promise<Enquiry[]> {
  await new Promise((r) => setTimeout(r, 350));

  const buyerId = isAgentSide ? "user_mock_buyer" : userId;

  const buyer = {
    buyerId,
    buyerName: "Femi Adeyemi",
    buyerAvatar: undefined,
    buyerEmail: "femi.adeyemi@example.com",
    buyerPhone: "+234 801 234 5678",
  };

  const agentUser = {
    agentId: isAgentSide ? userId : "user_mock_agent",
    agentName: "Chidi Okonkwo",
    agentAvatar: undefined,
    agentType: "user" as const,
    agentSubRole: "agent",
    agentVerificationStatus: "verified",
    contactUserId: isAgentSide ? userId : "user_mock_agent",
  };

  const agentCompany = {
    agentId: "company_mock_1",
    agentName: "Ridgepoint Realty",
    agentAvatar: undefined,
    agentType: "company" as const,
    companyId: "company_mock_1",
    companyName: "Ridgepoint Realty",
    companySlug: "ridgepoint-realty",
    contactUserId: isAgentSide ? userId : "user_mock_contact",
    contactUserName: "Ngozi Eze",
  };

  return [
    {
      id: "enq_mock_001",
      propertyId: "prop_mock_101",
      propertyTitle: "3-Bed Duplex, Lekki Phase 1",
      propertyImage: "/properties/lekki-duplex-1.jpg",
      ...buyer,
      ...agentUser,
      stage: "inspection",
      lastEventPreview: "Assistant: Inspection confirmed for Thursday 10am",
      lastEventAt: ago(2 * HOUR),
      unreadCount: 1,
      events: [
        {
          type: "message",
          id: "m_mock_1",
          sender: "buyer",
          text: 'Hi, I\'m interested in "3-Bed Duplex, Lekki Phase 1". Please contact me.',
          timestamp: ago(3 * DAY),
        },
        {
          type: "call",
          id: "c_mock_1",
          caller: "assistant",
          durationSeconds: 184,
          outcome: "answered",
          summary:
            "Buyer confirmed budget of ₦85M–₦100M, looking to move within 2 months. Interested in proceeding to inspection.",
          transcript:
            "Assistant: Hi Femi, I'm calling about your enquiry on the Lekki Phase 1 duplex...\nFemi: Yes, I saw it on the site. Is it still available?\nAssistant: It is. Can I ask your budget range and timeline?\nFemi: Around 85 to 100 million, hoping to move in the next couple of months.\nAssistant: Great, I'll let the agent know and we can get a viewing scheduled.",
          timestamp: ago(3 * DAY),
        },
        {
          type: "message",
          id: "m_mock_2",
          sender: "agent",
          text: "Hi Femi, thanks for your interest! I can do a viewing this week — would Thursday 10am work?",
          timestamp: ago(1 * DAY),
        },
        {
          type: "message",
          id: "m_mock_3",
          sender: "buyer",
          text: "Thursday 10am works for me, thank you!",
          timestamp: ago(1 * DAY),
        },
        {
          type: "call",
          id: "c_mock_2",
          caller: "assistant",
          durationSeconds: 46,
          outcome: "answered",
          summary:
            "Inspection confirmed for Thursday 10am. Reminder scheduled.",
          timestamp: ago(2 * HOUR),
        },
      ],
    },

    {
      id: "enq_mock_002",
      propertyId: "prop_mock_102",
      propertyTitle: "2-Bed Apartment, Ikoyi",
      propertyImage: "/properties/ikoyi-apartment-1.jpg",
      ...buyer,
      ...agentCompany,
      stage: "qualification",
      lastEventPreview: "Assistant call — missed",
      lastEventAt: ago(1 * DAY),
      unreadCount: 0,
      events: [
        {
          type: "message",
          id: "m_mock_4",
          sender: "buyer",
          text: 'Hi, I\'m interested in "2-Bed Apartment, Ikoyi". Please contact me.',
          timestamp: ago(1 * DAY),
        },
        {
          type: "call",
          id: "c_mock_3",
          caller: "assistant",
          durationSeconds: 0,
          outcome: "missed",
          timestamp: ago(1 * DAY),
        },
      ],
    },

    {
      id: "enq_mock_003",
      propertyId: "prop_mock_103",
      propertyTitle: "4-Bed Terrace, Gbagada",
      propertyImage: "/properties/gbagada-terrace-1.jpg",
      ...buyer,
      ...agentUser,
      stage: "selection",
      lastEventPreview: "Femi: Does it come with the furniture shown?",
      lastEventAt: ago(5 * HOUR),
      unreadCount: 2,
      events: [
        {
          type: "message",
          id: "m_mock_5",
          sender: "buyer",
          text: 'Hi, I\'m interested in "4-Bed Terrace, Gbagada". Please contact me.',
          timestamp: ago(8 * HOUR),
        },
        {
          type: "call",
          id: "c_mock_4",
          caller: "assistant",
          durationSeconds: 97,
          outcome: "answered",
          summary:
            "Buyer qualified: budget ₦120M, cash buyer, flexible timeline. Asked about furnishing.",
          timestamp: ago(8 * HOUR),
        },
        {
          type: "message",
          id: "m_mock_6",
          sender: "buyer",
          text: "Does it come with the furniture shown in the photos?",
          timestamp: ago(5 * HOUR),
        },
      ],
    },
  ];
}
