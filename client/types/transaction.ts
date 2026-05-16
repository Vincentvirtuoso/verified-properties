export type TransactionStatus =
  | "pending_remittance"
  | "remittance_received"
  | "disputed";

export interface Transaction {
  _id: string;
  listingId: string;
  inquiryId: string;

  remittingPartyId: string;
  remittingPartyType: "landlord" | "company";

  dealValue: number;
  remittanceAmount: number;
  currency: string;

  status: TransactionStatus;
  remittedAt?: Date;

  handledByCSAgent?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}
