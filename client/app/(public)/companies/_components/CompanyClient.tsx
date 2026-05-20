"use client";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PopulatedProperty } from "@/types/property";
import { Company } from "@/types/company";
import Image from "next/image";
import VerifiedBadge from "@/components/icons/VerifiedBadge";
import { FiMail, FiPhone, FiUsers } from "react-icons/fi";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { useState } from "react";
import { imageLoader } from "@/utils/helpers";
import { RoleBadge, StatCard, StatCardProps } from "@/components/ui";
import { Role } from "@/types";
import { LuBan, LuClock, LuInfo, LuUsers, LuWallet } from "react-icons/lu";

export default function CompanyPage({
  company,
  listings,
}: {
  company: Company;
  listings: PopulatedProperty[];
}) {
  console.log(listings);

  const defaultcompanyImage = "/placeholder_avatar.png";
  const [companyImageSrc, setCompanyImageSrc] = useState(
    company?.logo || defaultcompanyImage,
  );

  const stats: StatCardProps[] = [
    {
      label: "Active Listings",
      value: company?.activeListings ?? 0,
      icon: LuClock,
      accent: "success",
    },
    {
      label: "Total Remitted",
      value: company?.totalRemitted ?? 0,
      icon: LuWallet,
      accent: "warning",
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
      label: "Total Impressions",
      value: listings.reduce((sum, p) => sum + p.totalInquiries, 0),
      icon: LuInfo,
      accent: "info",
    },
    {
      label: "Team Size",
      value: company.team.length,
      icon: LuUsers,
      accent: "info",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs
          items={[
            { label: "Companies", href: "/companies" },
            { label: company.name, href: `/companies/${company._id}` },
          ]}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-neutral-400 overflow-hidden relative">
              {company.logo ? (
                <Image
                  src={companyImageSrc}
                  alt={company.name}
                  fill
                  loader={imageLoader}
                  onError={() => setCompanyImageSrc(defaultcompanyImage)}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                  {company.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {company.name}
                </h1>
                {company.verificationStatus === "verified" && <VerifiedBadge />}
                <RoleBadge
                  role={
                    company.type === "real_estate_company"
                      ? Role.Company
                      : Role.Developer
                  }
                />
              </div>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FiMail size={14} /> {company.contactEmail}
                </span>
                {company.contactPhone && (
                  <span className="flex items-center gap-1">
                    <FiPhone size={14} /> {company.contactPhone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FiUsers size={14} /> {company.team.length} member
                  {company.team.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
          {listings.length} Listing
          {listings.length !== 1 ? "s" : ""}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((property) => (
            <PropertyCard key={property._id} {...property} />
          ))}
        </div>
        {listings.length === 0 && (
          <p className="text-gray-500 text-center py-12">
            No listings available.
          </p>
        )}
      </div>
    </div>
  );
}
