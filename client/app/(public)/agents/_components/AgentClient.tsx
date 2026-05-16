"use client";

import { PopulatedProperty, PopulatedUser } from "@/types";
import Image from "next/image";
import VerifiedBadge from "@/components/icons/VerifiedBadge";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { PropertyCard } from "@/components/property/PropertyCard";
import {
  InfoRow,
  InfoRowProps,
  StatCard,
  StatCardProps,
} from "@/components/ui";
import {
  LuClockAlert,
  LuInfo,
  LuMail,
  LuMapPin,
  LuPhone,
  LuSwitchCamera,
  LuZap,
} from "react-icons/lu";
import { dummyUsers } from "@/data/users";
import { useState } from "react";
import { imageLoader } from "@/utils/helpers";
import { populateProperty } from "@/lib/utils";

export default function AgentClient({
  agent,
  listings,
}: {
  agent: PopulatedUser;
  listings: PopulatedProperty[];
}) {
  const populatedListings = listings.map((p) =>
    populateProperty(p, dummyUsers),
  );

  const defaultAgentImage = "/placeholder_avatar.png";
  const [agentImageSrc, setAgentImageSrc] = useState(
    agent?.avatar || defaultAgentImage,
  );

  const stats: StatCardProps[] = [
    {
      label: "Active Listings",
      value: agent.agentProfile?.activeListings ?? 0,
      icon: LuClockAlert,
      accent: "success",
    },
    {
      label: "Boosted",
      value: agent.agentProfile?.activeBoostedListings ?? 0,
      icon: LuZap,
      accent: "warning",
    },
    {
      label: "Closed Deals",
      value: listings.filter(
        (p) => p.status === "sold" || p.status === "rented",
      ).length,
      icon: LuSwitchCamera,
      accent: "destructive",
    },
    {
      label: "Total Impressions",
      value: listings.reduce((sum, p) => sum + p.totalInquiries, 0),
      icon: LuInfo,
      accent: "info",
    },
  ];

  const agentInfo: InfoRowProps[] = [
    {
      icon: LuMapPin,
      label: "Brokerage",
      value: agent.agentProfile?.brokerage,
    },
    {
      icon: LuMail,
      label: "Email",
      value: agent.email,
      href: `mailto:${agent.email}`,
    },
    {
      icon: LuPhone,
      label: "Phone Number",
      value: agent.phone,
      href: `tel:${agent.phone}`,
    },
  ];

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs
          items={[
            { label: "Agents", href: "/agents" },
            { label: agent.name, href: `/agents/${agent._id}` },
          ]}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-neutral-400 overflow-hidden relative">
              <Image
                src={agentImageSrc}
                alt={agent.name}
                fill
                loader={imageLoader}
                onError={() => setAgentImageSrc(defaultAgentImage)}
                className="object-cover"
              />
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {agent.name}
                </h1>
                {agent.agentProfile?.verificationStatus === "verified" && (
                  <VerifiedBadge size="lg" showText={false} />
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-600">
                {agentInfo.map((info) => (
                  <InfoRow key={info.label} {...info} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
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
