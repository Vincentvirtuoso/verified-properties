export type InquiryStatus =
  | "open"
  | "in_progress"
  | "deal_closed"
  | "cancelled";

export interface Inquiry {
  _id: string;
  listingId: string;
  viewerId: string;

  status: InquiryStatus;
  assignedCSAgent?: string;

  messages: InquiryMessage[];

  transactionId?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface InquiryMessage {
  _id: string;
  senderId: string;
  senderType: "viewer" | "cs_agent" | "system";
  content: string;
  sentAt: Date;
}
