"use client";

import { Property } from "@/types/property";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaBed, FaBath, FaExpand, FaAward } from "react-icons/fa";
import { FiClock, FiTag, FiTrendingDown } from "react-icons/fi";
import { formatPrice, formatRelativeTime } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RiHeartLine, RiHeartFill } from "react-icons/ri";
import { LuMapPin } from "react-icons/lu";
import { imageLoader } from "./helpers";
import VerifiedBadge from "../icons/VerifiedBadge";

const defaultImage = "/placeholder-property.png";
const defaultAgentImage = "/placeholder_agent.png";

export function PropertyCard({
  _id,
  slug,
  title,
  location,
  price,
  bedrooms,
  bathrooms,
  area = 0,
  image,
  listingType,
  sponsored = false,
  isFeatured,
  agent,
  discount,
  createdAt,
}: Property) {
  const router = useRouter();
  const [imgSrc, setImgSrc] = useState(image || defaultImage);
  const [imgAgentSrc, setImgAgentSrc] = useState(
    agent?.image || defaultAgentImage,
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const discountedPrice = discount?.percentage
    ? price - (price * discount.percentage) / 100
    : discount?.amount
      ? price - discount.amount
      : price;

  const hasDiscount = discount && (discount.percentage || discount.amount);
  const savingsAmount = price - discountedPrice;
  const savingsPercentage =
    discount?.percentage || Math.round((savingsAmount / price) * 100);

  const handleCardClick = () => {
    router.push(`/properties/${slug}`);
  };

  const handleAgentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (agent?.id) {
      router.push(`/agents/${agent.id}`);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    // toggleFavorite(_id);
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
      {hasDiscount && (
        <div className="absolute -top-5 -left-1 w-32 h-32 overflow-hidden z-20 pointer-events-none">
          <motion.div
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <div className="bg-linear-to-r from-destructive to-destructive/80 text-destructive-foreground py-1.5 px-8 transform -rotate-45 translate-y-6 -translate-x-8 shadow-lg">
              <div className="flex items-center gap-1">
                <FiTrendingDown className="w-3.5 h-3.5" />
                <span className="text-xs font-bold tracking-wider max-w-5">
                  {savingsPercentage}% OFF
                </span>
              </div>
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
          priority={isFeatured}
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
            "absolute space-y-2 z-10 pointer-events-none",
            hasDiscount ? "top-12 right-3" : "top-3 left-3",
          )}
        >
          {sponsored && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-linear-to-r from-warning to-warning/80 text-warning-foreground text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg flex items-center gap-1"
            >
              <FaAward />
              Sponsored
            </motion.div>
          )}

          {isFeatured && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-linear-to-r from-primary to-primary/80 text-primary-foreground text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg"
            >
              ✨ Featured
            </motion.div>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-background/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-foreground capitalize shadow-lg border border-border"
          >
            For {listingType}
          </motion.div>
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
          <span className="line-clamp-1">{location}</span>
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
          {agent && (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {agent.image ? (
                <Image
                  loader={imageLoader}
                  src={imgAgentSrc}
                  alt={agent.name}
                  width={28}
                  height={28}
                  onError={() => {
                    if (imgAgentSrc !== defaultAgentImage)
                      setImgAgentSrc(defaultAgentImage);
                  }}
                  className="rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {agent.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <button
                  onClick={handleAgentClick}
                  className="font-medium text-foreground/80 truncate hover:text-primary transition-colors text-left w-full"
                >
                  {agent.name}
                </button>
                {agent.verified && <VerifiedBadge />}
              </div>
            </div>
          )}

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
