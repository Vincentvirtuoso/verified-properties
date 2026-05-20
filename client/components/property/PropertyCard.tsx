"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FaBed, FaBath, FaExpand, FaFire } from "react-icons/fa";
import { FiClock, FiTag, FiTrendingDown } from "react-icons/fi";
import { RiHeartLine, RiHeartFill } from "react-icons/ri";
import { LuFileText, LuImage, LuMapPin, LuVideo } from "react-icons/lu";

import { Badge } from "@/components/ui";
import VerifiedBadge from "@/components/icons/VerifiedBadge";
import { LISTING_PURPOSE_LABELS } from "@/utils/constants";
import { formatPrice, formatRelativeTime } from "@/lib/formatters";
import { imageLoader } from "@/utils/helpers";
import { Role } from "@/types";
import { PopulatedProperty } from "@/types/property";
import { PopulatedUser } from "@/types";
import { cn } from "@/lib/utils";

const defaultImage = "/placeholder-property.png";

export function PropertyCard({
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
  ownerType,
  ownerId,
  status,
}: PopulatedProperty) {
  const router = useRouter();
  const [imgSrc, setImgSrc] = useState(image || defaultImage);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const discountedPrice = useMemo(() => {
    if (discount?.percentage)
      return price - (price * discount.percentage) / 100;
    if (discount?.amount) return price - discount.amount;
    return price;
  }, [price, discount]);

  const savingsAmount = useMemo(
    () => price - discountedPrice,
    [price, discountedPrice],
  );
  const savingsPercentage = useMemo(
    () => discount?.percentage ?? Math.round((savingsAmount / price) * 100),
    [discount, savingsAmount, price],
  );
  const hasDiscount = !!(discount?.percentage || discount?.amount);
  const hasDocuments = !!documents?.length;
  const hasVideoLinks = !!videoLinks?.length;
  const hasGallery = !!(gallery && gallery.length > 0);

  const defaultOwnerImage = "/placeholder_avatar.png";

  const locationString = location ? `${location.city}, ${location.state}` : "";

  const isCompany = ownerType === "company";
  const isLandlordOrAgent =
    ownerType === Role.Landlord || ownerType === Role.Agent;

  const ownerName = useMemo(() => {
    if (isCompany) return ownerId.companyId?.name || ownerId.name;
    return ownerId.name;
  }, [ownerId, isCompany]);

  const ownerInitial = ownerName?.charAt(0);

  const isVerified = useMemo(() => {
    if (isCompany) return ownerId.companyId?.verificationStatus === "verified";
    const user = ownerId as PopulatedUser;
    return (
      user.agentProfile?.verificationStatus === "verified" ||
      user.landlordProfile?.verificationStatus === "verified"
    );
  }, [ownerId, isCompany]);

  const ownerImg = useMemo(() => {
    if (isCompany) return ownerId.companyId?.logo;

    return ownerId.avatar;
  }, [ownerId, isCompany]);

  const [ownerImageSrc, setOwnerImageSrc] = useState(
    ownerImg || defaultOwnerImage,
  );

  const ownerRoute = useMemo(() => {
    if (isCompany) return `/companies/${ownerId.companyId?._id}`;
    const user = ownerId as PopulatedUser;
    const routePrefix =
      user.activeRole === Role.Landlord ? "landlords" : "agents";
    return `/${routePrefix}/${ownerId._id}`;
  }, [ownerId, isCompany]);

  const handleCardClick = () => {
    router.push(`/properties/${slug}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked((prev) => !prev);
  };

  const handleOwnerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(ownerRoute);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 group cursor-pointer relative h-full flex flex-col"
    >
      {status === "active"
        ? hasDiscount && (
            <div className="absolute -top-2 -left-1 w-32 h-32 overflow-hidden z-20 pointer-events-none">
              <motion.div
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <div className="bg-linear-to-r from-destructive to-destructive/80 text-destructive-foreground py-1.5 px-8 transform -rotate-45 translate-y-6 -translate-x-8 shadow-lg">
                  <div className="flex items-center gap-1">
                    <FiTrendingDown className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold tracking-wider max-w-20">
                      {savingsPercentage}% OFF
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          )
        : (status === "rented" || status === "sold") && (
            <div className="absolute -top-3.5 -left-1 w-32 h-32 overflow-hidden z-20 pointer-events-none">
              <motion.div
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <div className="bg-linear-to-r from-destructive to-destructive/80 text-destructive-foreground py-1.5 px-8 transform -rotate-45 translate-y-6 -translate-x-8 shadow-lg text-sm font-bold text-center">
                  {status.toUpperCase()}
                </div>
              </motion.div>
            </div>
          )}

      <div className="relative h-64 overflow-hidden shrink-0">
        <Image
          src={imgSrc}
          alt={title}
          loader={imageLoader}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={tier === "featured"}
          onError={() => {
            if (imgSrc !== defaultImage) setImgSrc(defaultImage);
          }}
          className={`object-cover transition-transform duration-700 ${
            isHovered ? "scale-110" : "scale-100"
          }`}
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div
          className={cn(
            "absolute top-3 z-10 pointer-events-none flex flex-wrap gap-2",
            hasDiscount ? "right-3 top-12" : "left-3",
          )}
        >
          {tier === "featured" && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-linear-to-r from-primary to-primary/80 text-primary-foreground text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg flex items-center gap-2"
            >
              <FaFire className="text-red-600" /> Featured
            </motion.div>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-background/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-foreground capitalize shadow-lg border border-border"
          >
            {LISTING_PURPOSE_LABELS[listingPurpose]}
          </motion.div>
        </div>

        <div className="absolute bottom-3 right-3 z-10 pointer-events-none flex flex-wrap gap-2">
          {hasDocuments && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-linear-to-r from-primary to-primary/80 text-primary-foreground text-md px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
            >
              <LuFileText size={18} /> {documents!.length}
            </motion.div>
          )}
          {hasVideoLinks && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-linear-to-r from-orange-600 to-orange-600/80 text-white text-md px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
            >
              <LuVideo size={18} /> {videoLinks!.length}
            </motion.div>
          )}
          {hasGallery && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-linear-to-r from-orange-600 to-orange-600/80 text-white text-md px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
            >
              <LuImage size={18} /> {gallery.length}
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4 z-10 flex gap-2"
            >
              <button
                onClick={handleLikeClick}
                className="bg-primary text-primary-foreground p-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg text-lg"
                aria-label={
                  isLiked ? "Remove from favourites" : "Add to favourites"
                }
              >
                {isLiked ? (
                  <RiHeartFill className="text-destructive" />
                ) : (
                  <RiHeartLine />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-baseline gap-2 flex-wrap shrink-0">
          {hasDiscount ? (
            <>
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-primary font-bold text-2xl tracking-tight">
                  {formatPrice(discountedPrice)}
                </p>
                <p className="text-muted-foreground text-sm line-through">
                  {formatPrice(price)}
                </p>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="bg-destructive/10 text-destructive text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"
              >
                <FiTag className="w-3 h-3" />
                Save {formatPrice(savingsAmount)}
              </motion.div>
            </>
          ) : (
            <p className="text-primary font-bold text-2xl tracking-tight">
              {formatPrice(price)}
            </p>
          )}
        </div>

        <h3 className="font-semibold text-lg mt-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors shrink-0 text-foreground">
          {title}
        </h3>

        <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1 shrink-0">
          <LuMapPin className="shrink-0" />
          <span className="line-clamp-1">{locationString}</span>
        </p>

        <div className="flex items-center gap-5 mt-auto pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FaBed className="text-lg" />
            <span className="font-medium">{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FaBath className="text-lg" />
            <span className="font-medium">{bathrooms}</span>
          </div>
          {area > 0 && (
            <div className="flex items-center gap-1.5">
              <FaExpand className="text-lg" />
              <span className="font-medium">{area.toLocaleString()} m²</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {ownerImageSrc ? (
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src={ownerImageSrc}
                  alt={ownerName}
                  width={100}
                  height={100}
                  loader={imageLoader}
                  onError={() => setOwnerImageSrc(defaultOwnerImage)}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {ownerInitial}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <button
                onClick={handleOwnerClick}
                className="font-medium text-foreground/80 truncate hover:text-primary transition-colors text-left w-full"
              >
                {ownerName}
              </button>
              <div className="flex items-center gap-1 mt-0.5">
                {isVerified && <VerifiedBadge />}
                <Badge
                  className="text-xs capitalize"
                  variant={isCompany ? "premium" : "secondary"}
                >
                  {ownerType}
                </Badge>
              </div>
            </div>
          </div>

          {createdAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground/60 shrink-0 ml-2">
              <FiClock size={13} className="shrink-0" />
              <span className="whitespace-nowrap">
                {formatRelativeTime(createdAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
