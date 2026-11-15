"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaBed, FaBath, FaExpand, FaFire } from "react-icons/fa";
import { FiClock, FiTag, FiTrendingDown } from "react-icons/fi";
import { RiHeartLine, RiHeartFill } from "react-icons/ri";
import {
  LuBuilding2,
  LuFileText,
  LuImage,
  LuMapPin,
  LuUserRound,
  LuVideo,
} from "react-icons/lu";

import { Badge, VerifiedBadge } from "@affilhomes/shared/ui";
import {
  agentSubRoleLabels,
  PopulatedUser,
  Role,
} from "@affilhomes/shared/types";
import type { PopulatedProperty } from "@affilhomes/shared/types/property";
import { useSavedProperties } from "@/contexts/SavedPropertiesContext";
import { LISTING_PURPOSE_LABELS, imageLoader } from "@/utils";
import { formatPrice, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useCanHover } from "@/hooks/useCanHover";

const DEFAULT_IMAGE = "/placeholder-property.png";
const DEFAULT_AVATAR = "/placeholder_avatar.png";

export function PropertyCard(listing: PopulatedProperty) {
  const {
    _id,
    slug,
    title,
    location,
    price,
    bedrooms,
    bathrooms,
    area = 0,
    image,
    listingPurpose,
    tier,
    discount,
    createdAt,
    documents,
    videoLinks,
    gallery,
    status,
    companyId,
    company,
    ownerId,
  } = listing;

  const router = useRouter();
  const { isSaved, toggleSaved } = useSavedProperties();
  const isLiked = isSaved(_id);

  const canHover = useCanHover();
  const [isHovered, setIsHovered] = useState(false);
  const showHoverLayer = !canHover || isHovered;

  const [imgSrc, setImgSrc] = useState(image || DEFAULT_IMAGE);

  const agent = ownerId as PopulatedUser;
  const listedForCompany = !!companyId;

  const headlineName = listedForCompany
    ? (company?.name ?? "Company")
    : agent.name;
  const headlineImage = listedForCompany ? company?.logo : agent.avatar;
  const headlineVerified = listedForCompany
    ? company?.verificationStatus === "verified"
    : agent.agentProfile?.verificationStatus === "verified";

  const companyRoute = company?._id ? `/companies/${company._id}` : null;
  const agentRoute = `/agents/${agent._id}`;
  const headlineRoute = listedForCompany ? companyRoute : agentRoute;

  const [headlineSrc, setHeadlineSrc] = useState(
    headlineImage || DEFAULT_AVATAR,
  );

  const holder = ownerId as PopulatedUser;
  const listerIsOwner = listedForCompany && company?.ownerId === holder._id;
  const holderIsAgent = holder.roles?.includes(Role.Agent) ?? false;

  const holderRoleLabel =
    holderIsAgent && holder.agentProfile?.subRole
      ? agentSubRoleLabels[holder.agentProfile.subRole]
      : null;

  const holderRoute = holderIsAgent ? `/agents/${holder._id}` : null;

  const discountedPrice = useMemo(() => {
    if (discount?.percentage)
      return price - (price * discount.percentage) / 100;
    if (discount?.amount) return price - discount.amount;
    return price;
  }, [price, discount]);

  const savingsAmount = price - discountedPrice;
  const savingsPercentage =
    discount?.percentage ??
    (price > 0 ? Math.round((savingsAmount / price) * 100) : 0);

  const hasDiscount = !!(discount?.percentage || discount?.amount);
  const hasDocuments = !!documents?.length;
  const hasVideoLinks = !!videoLinks?.length;
  const hasGallery = !!gallery?.length;

  const locationString = location ? `${location.city}, ${location.state}` : "";

  const openCard = () => router.push(`/properties/${slug}`);

  const navigate = (route: string | null) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (route) router.push(route);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaved(_id).then((ok) => {
      if (!ok) {
        router.push(
          `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
        );
      }
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-xl"
    >
      <div
        onClick={openCard}
        className="relative h-60 shrink-0 cursor-pointer overflow-hidden sm:h-64"
      >
        <Image
          src={imgSrc}
          alt={title}
          loader={imageLoader}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={tier === "featured"}
          onError={() => {
            if (imgSrc !== DEFAULT_IMAGE) setImgSrc(DEFAULT_IMAGE);
          }}
          className={cn(
            "object-cover transition-transform duration-700",
            isHovered && canHover ? "scale-105" : "scale-100",
          )}
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-black/10" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {tier === "featured" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md">
              <FaFire className="text-orange-500" />
              Featured
            </span>
          )}

          {status === "active" && hasDiscount && (
            <span className="rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
              {savingsPercentage}% OFF
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            {LISTING_PURPOSE_LABELS[listingPurpose]}
          </span>
        </div>

        {(status === "rented" || status === "sold") && (
          <div className="absolute bottom-3 left-3">
            <span className="rounded-lg bg-background/95 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground shadow-sm">
              {status}
            </span>
          </div>
        )}

        {(hasDocuments || hasVideoLinks || hasGallery) && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {hasDocuments && (
              <span className="flex h-8 items-center gap-1.5 rounded-lg bg-black/45 px-2.5 text-xs font-medium text-white backdrop-blur-md">
                <LuFileText size={14} />
                {documents?.length}
              </span>
            )}

            {hasVideoLinks && (
              <span className="flex h-8 items-center gap-1.5 rounded-lg bg-black/45 px-2.5 text-xs font-medium text-white backdrop-blur-md">
                <LuVideo size={14} />
                {videoLinks?.length}
              </span>
            )}

            {hasGallery && (
              <span className="flex h-8 items-center gap-1.5 rounded-lg bg-black/45 px-2.5 text-xs font-medium text-white backdrop-blur-md">
                <LuImage size={14} />
                {gallery?.length}
              </span>
            )}
          </div>
        )}

        <motion.button
          type="button"
          onClick={handleLikeClick}
          whileTap={{ scale: 0.9 }}
          aria-label={isLiked ? "Remove from favourites" : "Add to favourites"}
          aria-pressed={isLiked}
          className={cn(
            "absolute bottom-3 left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-background/90 shadow-md backdrop-blur-md transition-colors hover:bg-background",
            status === "rented" || status === "sold" ? "bottom-14" : "",
          )}
        >
          {isLiked ? (
            <RiHeartFill className="text-lg text-destructive" />
          ) : (
            <RiHeartLine className="text-lg text-foreground" />
          )}
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {formatPrice(discountedPrice)}
          </p>

          {hasDiscount && (
            <>
              <span className="text-sm text-muted line-through">
                {formatPrice(price)}
              </span>

              <span className="rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive">
                Save {formatPrice(savingsAmount)}
              </span>
            </>
          )}
        </div>

        <h3
          onClick={openCard}
          className="mt-3 line-clamp-2 cursor-pointer text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg"
        >
          {title}
        </h3>

        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <LuMapPin size={15} className="shrink-0" />
          <span className="truncate">{locationString}</span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/70 pb-4 text-sm text-muted">
          <span className="flex items-center gap-2">
            <FaBed size={15} />
            <span>{bedrooms} Beds</span>
          </span>

          <span className="flex items-center gap-2">
            <FaBath size={15} />
            <span>{bathrooms} Baths</span>
          </span>

          {area > 0 && (
            <span className="flex items-center gap-2">
              <FaExpand size={14} />
              <span>{area.toLocaleString()} m²</span>
            </span>
          )}
        </div>

        <div className="mt-auto flex min-w-0 items-center justify-between gap-3 pt-4">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
              <Image
                src={headlineSrc}
                alt={headlineName}
                fill
                sizes="36px"
                loader={imageLoader}
                onError={() => setHeadlineSrc(DEFAULT_AVATAR)}
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1">
                {headlineRoute ? (
                  <button
                    type="button"
                    onClick={navigate(headlineRoute)}
                    className="truncate text-left text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {headlineName}
                  </button>
                ) : (
                  <span className="truncate text-sm font-semibold text-foreground">
                    {headlineName}
                  </span>
                )}

                {headlineVerified && (
                  <VerifiedBadge showText={false} className="shrink-0" />
                )}
              </div>

              <div className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted">
                {!listedForCompany ? (
                  holderRoleLabel && (
                    <span className="truncate">{holderRoleLabel}</span>
                  )
                ) : (
                  <>
                    <span className="shrink-0">Listed by</span>

                    {listerIsOwner || !holderRoute ? (
                      <span className="truncate">{holder.name}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={navigate(holderRoute)}
                        className="truncate hover:text-primary"
                      >
                        {holder.name}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {createdAt && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted">
              <FiClock size={12} />
              {formatRelativeTime(createdAt, { short: true })}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
