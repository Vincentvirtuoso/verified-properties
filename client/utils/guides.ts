import { DocumentGuide } from "@/types/guide";
import type { PropertyDocumentType } from "@affilhomes/shared/types";

export const DOCUMENT_GUIDES: Record<PropertyDocumentType, DocumentGuide> = {
  certificateOfOccupancy: {
    name: "Certificate of Occupancy (C of O)",
    summary:
      "The C of O is the primary state-issued title document for land in Nigeria. It confirms the holder has a statutory or customary right of occupancy over a defined plot, typically for 99 years.",
    whatItProves:
      "That the state government has granted the named holder the right to occupy and use the plot for the stated purpose and term.",
    whoIssues:
      "The state government, through the Ministry of Lands, Survey and Town Planning (or equivalent).",
    whatToAsk: [
      "Is the name on the C of O the same as the seller's?",
      "Does the plot description match the survey plan?",
      "Has Governor's Consent been obtained for any past transfer?",
      "Is the term, purpose, and any covenant (e.g. residential-only) consistent with current use?",
    ],
  },

  certificateOfStatutoryRightOfOccupancy: {
    name: "Certificate of Statutory Right of Occupancy",
    summary:
      "The formal name for a C of O issued under the Land Use Act 1978 over statutory (urban) land. In everyday Nigerian practice this is the same instrument people call a C of O.",
    whatItProves:
      "The state's grant of a statutory right of occupancy to the named holder, over the described plot, for the stated term and purpose.",
    whoIssues: "The state governor, via the state lands ministry.",
    whatToAsk: [
      "Is the term and purpose stated consistent with current use?",
      "Has it been registered at the state lands registry?",
      "Does it reference any subsisting mortgage, lease, or third-party interest?",
    ],
  },

  governorsConsent: {
    name: "Governor's Consent",
    summary:
      "The state approval required under the Land Use Act for most transfers of a right of occupancy. Without it, a sale is technically void or voidable — often the single most-missed step in Nigerian transactions.",
    whatItProves:
      "That the state governor has approved a specific transfer of an existing right of occupancy to a new holder.",
    whoIssues:
      "The state governor (in practice, via the state lands authority or Land Bureau).",
    whatToAsk: [
      "Is there consent for the most recent transfer?",
      "Is the consent dated and linked to the current holder?",
      "Does the consent reference the same plot as the survey plan?",
    ],
  },

  gazette: {
    name: "Gazette",
    summary:
      "The official government publication that records land decisions — excisions, revocations, title grants, and allocations. It is the state's public record.",
    whatItProves:
      "The government's official position on the land at a point in time, and the fact of publication (which gives it public-notice effect).",
    whoIssues: "The state government (printed by the government printer).",
    whatToAsk: [
      "Does the gazette mention the specific plot and village / area?",
      "Is there a later gazette that supersedes or revokes it?",
      "Does the gazette reference the same survey coordinates as the plan in the seller's documents?",
    ],
  },

  deedOfAssignment: {
    name: "Deed of Assignment",
    summary:
      "The main document that transfers ownership of land or property from one party (the assignor) to another (the assignee). Usually read alongside a C of O and Governor's Consent.",
    whatItProves:
      "That the assignor has legally transferred their interest to the assignee on the terms set out in the deed.",
    whoIssues:
      "Prepared by the parties' lawyers; typically registered at the state lands registry.",
    whatToAsk: [
      "Is the deed properly executed, witnessed, stamped, and registered?",
      "Does the property description match the survey plan and any earlier title?",
      "Is the assignor's own title valid and unencumbered?",
    ],
  },

  deedOfConveyance: {
    name: "Deed of Conveyance",
    summary:
      "An older form of title-transfer deed still seen in transactions, especially in Lagos. Conveys the legal estate from one party to another, and is often part of a chain of title going back decades.",
    whatItProves:
      "That the conveyor has transferred their legal estate in the property to the conveyee.",
    whoIssues:
      "Prepared by the parties' lawyers; registered at the state lands registry.",
    whatToAsk: [
      "Is the deed properly stamped and registered?",
      "Does the property description match across every deed in the chain?",
      "Is the deed part of a continuous chain running up to the current seller?",
    ],
  },

  deedOfGift: {
    name: "Deed of Gift",
    summary:
      "A document transferring property without payment, typically to family or a trust. Properly executed, it is as binding as a sale and cannot easily be undone.",
    whatItProves:
      "That the donor has voluntarily transferred their interest to the donee without consideration.",
    whoIssues:
      "Prepared by the parties' lawyers; registered for enforceability against third parties.",
    whatToAsk: [
      "Is the gift absolute, or subject to conditions (e.g. life interest)?",
      "Has it been stamped and registered?",
      "Are there other heirs or beneficiaries who could challenge the gift?",
    ],
  },

  deedOfSurrender: {
    name: "Deed of Surrender",
    summary:
      "A document whereby a holder of a lease or right of occupancy gives up their interest to the landlord or the state, often before the term ends. Frequently used to pave the way for a fresh grant.",
    whatItProves:
      "That the surrendering party has relinquished their interest in favour of the other party.",
    whoIssues:
      "Executed by the surrendering party; usually registered at the lands registry.",
    whatToAsk: [
      "Has the surrender been accepted in writing by the landlord or state?",
      "Is any consideration stated, and does it match the deed?",
      "Does the surrender leave the current seller with anything to transfer?",
    ],
  },

  deedOfSublease: {
    name: "Deed of Sublease",
    summary:
      "A document granting a shorter leasehold interest carved out of an existing head lease. Common in estates, malls, and commercial properties.",
    whatItProves:
      "That the sublessor has granted the sublessee a lease for a defined term within the head lease, subject to its terms.",
    whoIssues:
      "The sublessor (usually the head lessee); head-landlord consent is often required.",
    whatToAsk: [
      "How long is the sublease compared to the remaining head lease?",
      "Does the head lease require landlord consent to sublease, and has it been obtained?",
      "Are there any restrictive covenants on use?",
    ],
  },

  deedOfLease: {
    name: "Deed of Lease",
    summary:
      "A document granting the right to occupy and use property for a defined term in exchange for rent. The lessee has a protected interest but not ownership.",
    whatItProves:
      "The lessee's right to occupy the property for the agreed term, subject to the covenants in the deed.",
    whoIssues:
      "The lessor (owner or head lessee); often registered with the state.",
    whatToAsk: [
      "What is the term, rent, and any renewal option?",
      "Are there restrictive covenants that limit use?",
      "Is the landlord's own title to the property good?",
    ],
  },

  deedOfMortgage: {
    name: "Deed of Mortgage",
    summary:
      "A document creating a mortgage over property as security for a loan. If the borrower defaults, the lender can enforce the mortgage against the property.",
    whatItProves:
      "That the property has been pledged as security for a debt, and the lender's rights over it.",
    whoIssues:
      "Prepared by the parties' lawyers; registered at the lands registry (and often at the Corporate Affairs Commission where the lender is a company).",
    whatToAsk: [
      "Has the mortgage been discharged if the loan is repaid?",
      "Is there a subsisting mortgage that limits the seller's ability to transfer?",
      "Does the mortgage reference the same plot as the survey plan?",
    ],
  },

  surveyPlan: {
    name: "Survey Plan",
    summary:
      "A map prepared by a licensed surveyor showing the exact boundaries, size, coordinates, and position of a plot. Used to verify that what's on paper matches what's on the ground.",
    whatItProves:
      "The physical location, boundaries, and area of the plot, as surveyed on the ground.",
    whoIssues:
      "A licensed surveyor; for statutory land, usually approved by the state survey department.",
    whatToAsk: [
      "Does the area on the plan match the listed area?",
      "Is the plan beaconed on the ground, and can you walk the boundaries?",
      "Has the plan been approved by the state survey department?",
    ],
  },

  registeredSurveyPlan: {
    name: "Registered Survey Plan",
    summary:
      "A survey plan lodged with and registered by the state survey / lands authority. Stronger than an unregistered plan because the state holds a matching record.",
    whatItProves:
      "That the state survey authority has a record of the plot's boundaries and coordinates at a point in time.",
    whoIssues:
      "A licensed surveyor; registered with the state survey department.",
    whatToAsk: [
      "Is the registration number on the plan visible and verifiable?",
      "Does the registered plan match the one in the seller's documents?",
      "Does the plan conflict with a later registered plan covering the same area?",
    ],
  },

  approvedBuildingPlan: {
    name: "Approved Building Plan",
    summary:
      "A building plan submitted to and approved by the local planning authority. Confirms the building is approved to be built as designed.",
    whatItProves:
      "That the local authority has approved the building's design, use, and siting on the plot.",
    whoIssues:
      "The local planning authority (e.g. Lagos State Physical Planning Permit Authority).",
    whatToAsk: [
      "Is the approval current, or has it expired?",
      "Does the approved plan match what's actually been built?",
      "Have any later changes (extensions, change of use) been separately approved?",
    ],
  },

  excisionDocument: {
    name: "Excision Document",
    summary:
      "Evidence that a portion of land has been excised (released) from government acquisition and returned to the community or original owners. Common for family land in Lagos and Ogun.",
    whatItProves:
      "That the land is no longer under government acquisition and is available for allocation and title.",
    whoIssues:
      "The state government, usually via the lands ministry, and published in the state gazette.",
    whatToAsk: [
      "Is the excision gazetted, and does the plot fall within the excised area?",
      "Who are the accredited family representatives?",
      "Is there a later gazette that revokes or reduces the excision?",
    ],
  },

  letterOfAllocation: {
    name: "Letter of Allocation",
    summary:
      "A letter from a government agency or estate developer allocating a plot to a named person, subject to conditions and payment. Often a precursor to a C of O.",
    whatItProves:
      "That the issuing authority has allocated the plot to the named allottee on the stated conditions.",
    whoIssues:
      "A state lands bureau, a local government, or an estate developer.",
    whatToAsk: [
      "Are all conditions (payments, development milestones) satisfied?",
      "Has the allocation been formalised into a title (C of O)?",
      "Is the allocating authority the one legally entitled to allocate the plot?",
    ],
  },

  contractOfSale: {
    name: "Contract of Sale",
    summary:
      "A written agreement setting out the terms of a property sale — price, payment schedule, property description, conditions, and completion.",
    whatItProves:
      "The terms the parties have agreed, and the obligations of each side.",
    whoIssues: "Prepared by the parties (often their lawyers).",
    whatToAsk: [
      "Does the description of the property match the survey plan and title?",
      "What are the completion conditions and timelines?",
      "What remedies are available if the seller fails to deliver title?",
    ],
  },

  landPurchaseAgreement: {
    name: "Land Purchase Agreement",
    summary:
      "A written agreement specifically for the purchase of land, setting out price, payment terms, boundaries, and the seller's obligations to deliver good title.",
    whatItProves:
      "The agreed terms of the land sale and each party's obligations.",
    whoIssues:
      "Prepared by the parties or their lawyers; usually registered after completion.",
    whatToAsk: [
      "Does the description match the survey plan?",
      "Are the seller's title documents listed and verified?",
      "Is there a clear timetable for delivery of title and Governor's Consent?",
    ],
  },

  receiptOfPaymentForLand: {
    name: "Receipt of Payment for Land",
    summary:
      "Proof that payment was made for a plot, often issued by a family, agent, or developer. Useful evidence, but not by itself a title document.",
    whatItProves:
      "That money changed hands for the land, and the amount and date.",
    whoIssues: "The seller, family, or developer.",
    whatToAsk: [
      "Does the receipt reference the specific plot and payee?",
      "Is it signed and dated by a person who actually has authority to sell?",
      "Does it align with the amounts and schedule in the purchase agreement?",
    ],
  },

  powerOfAttorney: {
    name: "Power of Attorney",
    summary:
      "A document authorising one person (the attorney) to act on another's behalf for specified purposes — often to sell, manage, or deal with property.",
    whatItProves:
      "That the attorney has been authorised to act for the donor within the powers and limits stated.",
    whoIssues:
      "Executed by the donor; usually notarised and registered at the lands registry where it affects land.",
    whatToAsk: [
      "Is it general or limited, and to what specific powers?",
      "Is it still valid, or has it been revoked?",
      "Is the donor alive and competent at the time of the transaction?",
    ],
  },

  irrevocablePowerOfAttorney: {
    name: "Irrevocable Power of Attorney",
    summary:
      "A POA stated to be irrevocable, usually given in connection with a loan or another interest. Courts scrutinise these closely — 'irrevocable' is not absolute.",
    whatItProves:
      "The donor's intention to authorise the attorney on terms stated to be irrevocable.",
    whoIssues: "Executed by the donor; registered.",
    whatToAsk: [
      "What consideration supports the claim of irrevocability?",
      "Is there a court decision or statutory rule limiting the claim?",
      "Has the donor purported to revoke it anyway, and if so, is the revocation valid?",
    ],
  },

  taxClearanceCertificate: {
    name: "Tax Clearance Certificate",
    summary:
      "A certificate from the state tax authority confirming the holder has paid their taxes for a stated period. Often required for land transactions involving state consent.",
    whatItProves:
      "That the named person has tax clearance for the period stated.",
    whoIssues: "The relevant state internal revenue service.",
    whatToAsk: [
      "Is the certificate for the current period, and in whose name?",
      "Is it required for Governor's Consent for this transaction, and is it in the seller's name?",
      "Does the certificate match the seller's identity in the title documents?",
    ],
  },

  affidavitOfLoss: {
    name: "Affidavit of Loss",
    summary:
      "A sworn statement, made before a commissioner for oaths, that a document (such as a C of O or deed) has been lost. Used to support an application for a certified true copy or replacement.",
    whatItProves:
      "That the deponent has sworn the original document was lost and has not been recovered.",
    whoIssues:
      "Sworn by the deponent before a commissioner for oaths or notary public.",
    whatToAsk: [
      "Is the original truly lost, or is it being held by someone else?",
      "Has a replacement been issued, and is it valid and current?",
      "Has the loss been reported, and is there a police report backing the affidavit?",
    ],
  },

  probateLetterOfAdministration: {
    name: "Probate / Letter of Administration",
    summary:
      "A court-issued document confirming who is entitled to deal with the estate of a deceased person. Required to sell property owned by someone who has died. Probate applies where there is a will; Letter of Administration where there isn't.",
    whatItProves:
      "The authority of the personal representative or administrator to deal with the deceased's property.",
    whoIssues: "The High Court (probate registry).",
    whatToAsk: [
      "Does the estate include the specific property?",
      "Is the person selling the property the named administrator or executor?",
      "Has the grant been resealed or re-registered where the property sits in a different state?",
    ],
  },
};

export const LEGACY_DOCUMENT_GUIDE_ALIASES: Record<
  string,
  PropertyDocumentType
> = {
  cofo: "certificateOfOccupancy",
  "governors-consent": "governorsConsent",
  "survey-plan": "surveyPlan",
};

export function getDocumentGuide(
  key: PropertyDocumentType | string,
): DocumentGuide | undefined {
  const direct = DOCUMENT_GUIDES[key as PropertyDocumentType];
  if (direct) return direct;

  const aliased = LEGACY_DOCUMENT_GUIDE_ALIASES[key];
  return aliased ? DOCUMENT_GUIDES[aliased] : undefined;
}
