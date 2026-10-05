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
  agentId: string;
  agentName: string;
  stage: "qualification" | "selection" | "inspection"; 
  lastEventPreview: string;
  lastEventAt: Date;
  unreadCount: number;
  events: ThreadEvent[];
}
