"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  RiPhoneLine,
  RiMailLine,
  RiWhatsappLine,
  RiBuildingLine,
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

  let profileHref = "#";
  if (isCompany) {
    profileHref = `/companies/${owner._id}`;
  } else {
    const user = owner;
    profileHref = `/agents/${user._id}`;
  }

  const displayRoleLabel = isCompany
    ? "Company"
    : owner.activeRole
      ? owner.activeRole.charAt(0).toUpperCase() + owner.activeRole.slice(1)
      : "Listing Owner";

  const companyObj = isCompany
    ? null
    : owner.companyId
      ? typeof owner.companyId === "object"
        ? (owner.companyId as Company)
        : null
      : null;
  const affiliatedCompanyName = companyObj ? companyObj.name : undefined;

  return (
    <motion.div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
    >
      <div className="h-1.5 bg-linear-to-r from-violet-500 to-violet-700" />

      <div className="p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-subtle mb-3">
            Listed by
          </p>

          <div className="flex items-center gap-3">
            <div
              className={`relative w-14 h-14 ${
                isCompany ? "rounded-xl" : "rounded-full"
              } overflow-hidden bg-muted/10 shrink-0 ring-2 ring-violet-100 dark:ring-violet-900`}
            >
              <Image
                src={imgSrc}
                alt={name || "Owner image"}
                fill
                sizes="56px"
                loader={imageLoader}
                onError={() =>
                  setImgSrc(isCompany ? defaultLogo : defaultAvatar)
                }
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {name}
                </p>
                {isVerified && <VerifiedBadge size="sm" showText={false} />}
              </div>

              {affiliatedCompanyName && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                  <RiBuildingLine size={13} className="shrink-0" />
                  {affiliatedCompanyName}
                </p>
              )}

              <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                {displayRoleLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-medium transition-all duration-200"
            >
              <RiMailLine size={14} className="shrink-0 text-violet-500" />
              <span className="truncate">{email}</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all duration-200 min-w-0 flex-1"
            >
              <RiPhoneLine size={14} className="shrink-0" />
              <span className="truncate">{phone}</span>
            </a>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all duration-200 shrink-0"
              title="Chat on WhatsApp"
            >
              <RiWhatsappLine size={15} className="shrink-0" />
            </a>
          )}

          <Link
            href={profileHref}
            className="flex items-center justify-center border border-primary/30 text-primary dark:text-primary-foreground hover:bg-primary/5 py-2.5 px-3.5 text-xs font-bold rounded-xl transition-all duration-200 shrink-0"
          >
            View Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
