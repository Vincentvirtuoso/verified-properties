"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  RiArrowLeftLine,
  RiCalendarLine,
  RiRefreshLine,
  RiHome4Line,
} from "react-icons/ri";
import { PopulatedProperty } from "@/types/property";

import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyHeader from "@/components/property/PropertyHeader";
import PropertyStats from "@/components/property/PropertyStats";
import PropertyDescription from "@/components/property/PropertyDescription";
import PropertyDocuments from "@/components/property/PropertyDocuments";
import PropertyVideos from "@/components/property/PropertyVideos";
import ContactForm from "@/components/property/ContactForm";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { useEffect, useState } from "react";
import { LocationPlaceholder } from "@/components/property/PropertyLocation";
import AgentCard from "@/components/property/AgentCard";

interface PropertyDetailClientProps {
  property: PopulatedProperty;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function PropertyDetailClient({
  property,
}: PropertyDetailClientProps) {
  const { bannerHeight } = useBannerHeightContext();
  const [stickyTop, setStickyTop] = useState<string>("auto");

  useEffect(() => {
    const updateTop = () => {
      const isLg = window.innerWidth >= 1024;
      if (isLg) {
        setStickyTop(`${85 + (bannerHeight || 0)}px`);
      } else {
        setStickyTop("auto");
      }
    };
    updateTop();
    window.addEventListener("resize", updateTop);
    return () => window.removeEventListener("resize", updateTop);
  }, [bannerHeight]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container max-w-7xl py-3 flex items-center justify-between gap-4">
          <Link
            href="/properties"
            className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors"
          >
            <RiArrowLeftLine size={16} />
            Back to listings
          </Link>

          <nav className="hidden md:flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
            <Link
              href="/"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <RiHome4Line size={13} />
              Home
            </Link>
            <span>/</span>
            <Link
              href="/properties"
              className="hover:text-primary transition-colors"
            >
              Properties
            </Link>
            <span>/</span>
            <span className="text-neutral-600 dark:text-neutral-300 truncate max-w-45">
              {property.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="container max-w-7xl py-6 md:py-8">
        <motion.div {...fadeUp} className="mb-8">
          <PropertyGallery
            mainImage={property.image}
            gallery={property.gallery}
            title={property.title}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          <div className="lg:col-span-2 space-y-8">
            <PropertyHeader property={property} />

            <div className="border-t border-border" />

            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <PropertyStats property={property} />
            </motion.div>

            {property.description && (
              <>
                <div className="border-t border-border" />
                <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
                  <PropertyDescription
                    description={property.description}
                    title={property.title}
                  />
                </motion.div>
              </>
            )}

            {property.videoLinks && property.videoLinks.length > 0 && (
              <>
                <div className="border-t border-border" />
                <PropertyVideos videoLinks={property.videoLinks} />
              </>
            )}

            {property.documents && property.documents.length > 0 && (
              <>
                <div className="border-t border-border" />
                <PropertyDocuments documents={property.documents} />
              </>
            )}

            <LocationPlaceholder
              location={property.location}
              showMap
              zoom={15}
              mapHeight={250}
            />

            <div className="border-t border-border pt-5 flex flex-wrap items-center gap-4 text-xs text-neutral-400 dark:text-neutral-500">
              <span className="flex items-center gap-1.5">
                <RiCalendarLine size={13} />
                Listed:{" "}
                {property.createdAt
                  ? new Date(property.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </span>
              {property.updatedAt && (
                <span className="flex items-center gap-1.5">
                  <RiRefreshLine size={13} />
                  Updated:{" "}
                  {new Date(property.updatedAt).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky space-y-4" style={{ top: stickyTop }}>
              {typeof property.ownerId !== "string" && (
                <AgentCard
                  owner={property.ownerId}
                  ownerType={property.ownerType}
                />
              )}
              <ContactForm
                propertyId={property._id}
                propertyTitle={property.title}
                ownerId={
                  typeof property.ownerId === "string"
                    ? property.ownerId
                    : property.ownerId._id
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
