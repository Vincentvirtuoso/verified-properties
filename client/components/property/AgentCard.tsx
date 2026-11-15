"use client";

import { motion } from "framer-motion";
import {
  RiPhoneLine,
  RiMailLine,
  RiWhatsappLine,
  RiBuildingLine,
  RiArrowRightLine,
  RiUserLine,
} from "react-icons/ri";
import Link from "next/link";
import {
  PopulatedProperty,
  Company,
  PropertyOwnerType,
} from "@affilhomes/shared/types";
import { Avatar, VerifiedBadge } from "@affilhomes/shared/ui";

interface OwnerCardProps {
  /** The person holding the listing (property.ownerId). */
  owner: PopulatedProperty["ownerId"];
  /** Who holds the listing. Describes the holder, not the company. */
  ownerType: PropertyOwnerType;
  /** The listing's own company (property.company). Null for independent listings. */
  company?: Company | null;
}

/** Normalises a Nigerian number to international form for tel: links. */
function toDialable(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  if (digits.startsWith("234")) return `+${digits}`;
  return `+${digits}`;
}

export default function OwnerCard({ owner, company }: OwnerCardProps) {
  // Company listing when the listing has a company. Nothing else decides it.
  const isCompanyListing = Boolean(company);

  // Company listings: show the company's details only.
  // Independent listings: show the agent's details only.
  const name = isCompanyListing && company ? company.name : owner.name;
  const logo = isCompanyListing && company ? company.logo : owner.avatar;
  const verified = isCompanyListing
    ? company?.verificationStatus === "verified"
    : owner.agentProfile?.verificationStatus === "verified";

  const phone = isCompanyListing ? company?.contactPhone : owner.phone;
  const whatsapp = isCompanyListing
    ? company?.whatsappNumber
    : owner.whatsappNumber;
  const email = isCompanyListing ? company?.contactEmail : owner.email;

  const telHref = phone ? `tel:${toDialable(phone)}` : null;
  const whatsappHref = whatsapp
    ? `https://wa.me/${toDialable(whatsapp).replace(/\D/g, "")}`
    : null;

  const profileHref =
    isCompanyListing && company?.slug
      ? `/companies/${company.slug}`
      : `/agents/${owner._id}`;

  return (
    <motion.div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3.5">
          <Avatar src={logo} alt={name} name={name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-foreground truncate">{name}</p>
              {verified && <VerifiedBadge size="sm" showText={false} />}
            </div>
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-0.5">
              {isCompanyListing ? "Company" : "Agent"}
            </p>
          </div>
        </div>

        {isCompanyListing && (
          <div className="rounded-xl bg-muted/30 px-3 py-2.5 text-xs text-muted flex items-center gap-2">
            <RiUserLine size={14} className="shrink-0" />
            <span className="min-w-0 truncate">
              Listed by{" "}
              <span className="font-medium text-foreground">{owner.name}</span>
            </span>
          </div>
        )}

        {telHref || whatsappHref ? (
          <div className="flex gap-2">
            {telHref && (
              <a
                href={telHref}
                aria-label={`Call ${name}`}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors"
              >
                <RiPhoneLine size={14} />
                Call
              </a>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${name}`}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                <RiWhatsappLine size={14} />
                WhatsApp
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted text-center">
            No direct contact details. Send an enquiry instead.
          </p>
        )}

        <Link
          href={profileHref}
          className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted/50 font-semibold text-xs transition-colors"
        >
          {isCompanyListing ? "View company" : "View profile"}
        </Link>

        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors truncate pt-0.5"
          >
            <RiMailLine size={13} className="shrink-0" />
            <span className="truncate">{email}</span>
          </a>
        )}
      </div>
    </motion.div>
  );
}
