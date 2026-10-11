"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  RiPhoneLine,
  RiMailLine,
  RiWhatsappLine,
  RiBuildingLine,
  RiArrowRightLine,
} from "react-icons/ri";
import Link from "next/link";
import { useState } from "react";
import { imageLoader } from "@/utils/helpers";
import { PopulatedProperty, Company, PropertyOwnerType } from "@/types";
import VerifiedBadge from "../icons/VerifiedBadge";

interface OwnerCardProps {
  owner: PopulatedProperty["ownerId"];
  ownerType: PropertyOwnerType;
}

export default function OwnerCard({ owner, ownerType }: OwnerCardProps) {
  const isCompany = ownerType === "company";
  const name = isCompany ? owner.companyId?.name : owner.name;

  const defaultAvatar = "/placeholder_avatar.png";
  const defaultLogo = "/placeholder_company.svg";

  const imageSrc = isCompany
    ? owner.companyId?.logo || defaultLogo
    : owner.avatar || defaultAvatar;

  const [imgSrc, setImgSrc] = useState(imageSrc);

  const isVerified = isCompany
    ? owner.companyId?.verificationStatus === "verified"
    : owner.agentProfile?.verificationStatus === "verified";

  const email = isCompany ? owner.companyId?.contactEmail : owner.email;
  const phone = isCompany ? owner.companyId?.contactPhone : owner.phone;
  const whatsappNumber = isCompany
    ? owner.companyId?.whatsappNumber
    : owner.whatsappNumber;

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : null;

  const profileHref = isCompany
    ? `/companies/${owner._id}`
    : `/agents/${owner._id}`;

  const displayRoleLabel = isCompany
    ? "Company"
    : owner.activeRole
      ? owner.activeRole.charAt(0).toUpperCase() + owner.activeRole.slice(1)
      : "Listing Owner";

  const companyObj = isCompany
    ? null
    : owner.companyId && typeof owner.companyId === "object"
      ? (owner.companyId as Company)
      : null;
  const affiliatedCompanyName = companyObj?.name;

  const hasContactActions = Boolean(phone) || Boolean(whatsappUrl);

  return (
    <motion.div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
    >

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`relative w-14 h-14 shrink-0 overflow-hidden bg-muted/10 ring-2 ring-violet-100 dark:ring-violet-900 ${
              isCompany ? "rounded-xl" : "rounded-full"
            }`}
          >
            <Image
              src={imgSrc}
              alt={name || "Owner image"}
              fill
              sizes="56px"
              loader={imageLoader}
              onError={() => setImgSrc(isCompany ? defaultLogo : defaultAvatar)}
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-foreground truncate">{name}</p>
              {isVerified && <VerifiedBadge size="sm" showText={false} />}
            </div>

            <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-0.5">
              {displayRoleLabel}
            </p>

            {affiliatedCompanyName && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <RiBuildingLine size={12} className="shrink-0" />
                <span className="truncate">{affiliatedCompanyName}</span>
              </p>
            )}
          </div>
        </div>

        {hasContactActions && (
          <div className="flex gap-2">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                <RiPhoneLine size={14} />
                Call
              </a>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <RiWhatsappLine size={14} />
                WhatsApp
              </a>
            )}
          </div>
        )}

        <Link
          href={profileHref}
          className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted/50 font-semibold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          View Profile
          <RiArrowRightLine size={14} />
        </Link>

        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors truncate pt-0.5"
          >
            <RiMailLine size={13} className="shrink-0" />
            <span className="truncate">{email}</span>
          </a>
        )}
      </div>
    </motion.div>
  );
}
