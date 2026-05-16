"use client";

import { PropertyCard } from "@/components/property/PropertyCard";
import { PopulatedUser } from "@/types/user";
import { PopulatedProperty } from "@/types/property";
import Image from "next/image";
import VerifiedBadge from "@/components/icons/VerifiedBadge";
import { populateProperty } from "@/lib/utils";
import { dummyUsers } from "@/data/users";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import {
  InfoRow,
  InfoRowProps,
  StatCard,
  StatCardProps,
} from "@/components/ui";
import { LuBan, LuClock, LuInfo, LuMail, LuPhone } from "react-icons/lu";
import { useState } from "react";
import { imageLoader } from "@/utils/helpers";

export default function LandlordClient({
  landlord,
  listings,
}: {
  landlord: PopulatedUser;
  listings: PopulatedProperty[];
}) {
  const populatedListings = listings.map((p) =>
    populateProperty(p, dummyUsers),
  );

  const stats: StatCardProps[] = [
    {
      label: "Active Listings",
      value: landlord.landlordProfile?.activeListings ?? 0,
      icon: LuClock,
      accent: "success",
    },
    {
      label: "Closed Deals",
      value: listings.filter(
        (p) => p.status === "sold" || p.status === "rented",
      ).length,
      icon: LuBan,
      accent: "destructive",
    },
    {
      label: "Total Inquiries",
      value: listings.reduce((sum, p) => sum + p.totalInquiries, 0),
      icon: LuInfo,
      accent: "info",
    },
  ];

  const landlordInfo: InfoRowProps[] = [
    {
      icon: LuMail,
      label: "Email",
      value: landlord.email,
      href: `mailto:${landlord.email}`,
    },
    {
      icon: LuPhone,
      label: "Phone Number",
      value: landlord.phone,
      href: `tel:${landlord.phone}`,
    },
  ];

  const defaultLandlordImage = "/placeholder_avatar.png";
  const [landlordImageSrc, setLandlordImageSrc] = useState(
    landlord?.avatar || defaultLandlordImage,
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs
          items={[
            { label: "Landlords", href: "/landlords" },
            { label: landlord.name, href: `/landlords/${landlord._id}` },
          ]}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden relative">
              <Image
                src={landlordImageSrc}
                alt={landlord.name}
                fill
                loader={imageLoader}
                onError={() => setLandlordImageSrc(defaultLandlordImage)}
                className="object-cover"
              />
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {landlord.name}
                </h1>
                {landlord.landlordProfile?.verificationStatus ===
                  "verified" && <VerifiedBadge />}
              </div>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-600">
                {landlordInfo.map((info) => (
                  <InfoRow key={info.label} {...info} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <StatCard {...stat} key={stat.label} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-16">
        <h2 className="text-xl font-semibold mb-6">
          {populatedListings.length} Listing
          {populatedListings.length !== 1 ? "s" : ""}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {populatedListings.map((property) => (
            <PropertyCard key={property._id} {...property} />
          ))}
        </div>
        {populatedListings.length === 0 && (
          <p className="text-gray-500 text-center py-12">
            No listings available.
          </p>
        )}
      </div>
    </div>
  );
}
