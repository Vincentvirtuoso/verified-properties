type ThreadEventType = "message" | "call";

interface ThreadMessage {
  type: "message";
  id: string;
  sender: "buyer" | "agent" | "assistant";
  text: string;
  timestamp: Date;
}

interface ThreadCall {
  type: "call";
  id: string;
  caller: "assistant" | "agent";
  durationSeconds: number;
  outcome: "answered" | "missed" | "voicemail";
  transcript?: string;
  summary?: string;
  timestamp: Date;
}

export type ThreadEvent = ThreadMessage | ThreadCall;

export interface Enquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  /** Callback number the buyer left; only visible to the assigned agent. */
  buyerPhone?: string;
  agentId: string;
  agentName: string;
  stage: "qualification" | "selection" | "inspection";
  status?: "open" | "in_progress" | "deal_closed" | "cancelled";
  lastEventPreview: string;
  lastEventAt: Date;
  unreadCount: number;
  events: ThreadEvent[];
}
