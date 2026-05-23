"use client";

import { PropertyCard } from "@/components/property/PropertyCard";
import { PopulatedProperty } from "@/types/property";
import { Company, companyTypeLabels } from "@/types/company";
import Image from "next/image";
import VerifiedBadge from "@/components/icons/VerifiedBadge";
import { FiMail, FiPhone, FiUsers, FiMessageCircle } from "react-icons/fi";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { useState } from "react";
import { imageLoader } from "@/utils/helpers";
import { RoleBadge, StatCard } from "@/components/ui";
import { Role } from "@/types";
import { LuClock, LuWallet, LuUsers, LuTrendingUp, LuBuilding } from "react-icons/lu";
import { Badge } from "@/components/ui/Badge";

export default function CompanyPage({
  company,
  listings,
}: {
  company: Company;
  listings: PopulatedProperty[];
}) {
  const defaultCompanyImage = "/placeholder_avatar.png";
  const [companyImageSrc, setCompanyImageSrc] = useState(
    company?.logo || defaultCompanyImage
  );

  const companyTypeLabel = companyTypeLabels[company.type];

  const stats = [
    {
      label: "Active Listings",
      value: company.activeListings ?? 0,
      icon: LuClock,
      accent: "success" as const,
    },
    {
      label: "Total Remitted",
      value: `₦${(company.totalRemitted ?? 0).toLocaleString()}`,
      icon: LuWallet,
      accent: "warning" as const,
    },
    {
      label: "Closed Deals",
      value: listings.filter((p) => p.status === "sold" || p.status === "rented").length,
      icon: LuTrendingUp,
      accent: "destructive" as const,
    },
    {
      label: "Team Size",
      value: company.team.length,
      icon: LuUsers,
      accent: "info" as const,
    },
    {
      label: "Total Impressions",
      value: listings.reduce((sum, p) => sum + (p.totalInquiries || 0), 0),
      icon: LuBuilding,
      accent: "info" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs
          items={[
            { label: "Companies", href: "/companies" },
            { label: company.name, href: `/companies/${company._id}` },
          ]}
        />
      </div>

      {/* Hero / Company Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative">
            <div className="absolute -bottom-12 left-6 sm:left-8 flex items-end gap-6">
              {/* Logo */}
              <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card shadow-md overflow-hidden relative">
                {company.logo ? (
                  <Image
                    src={companyImageSrc}
                    alt={company.name}
                    fill
                    loader={imageLoader}
                    onError={() => setCompanyImageSrc(defaultCompanyImage)}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground bg-muted">
                    {company.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-16 pb-6 px-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
                  {company.verificationStatus === "verified" && <VerifiedBadge size="lg" />}
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary" className="font-medium">
                    {companyTypeLabel}
                  </Badge>
                  <RoleBadge role={Role.Company} />
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex gap-3">
                {company.whatsappNumber && (
                  <a
                    href={`https://wa.me/${company.whatsappNumber.replace(/\D/g, "")}`}
                    target="_blank"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <FiMessageCircle className="w-5 h-5" />
                    <span className="font-medium">WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <a href={`mailto:${company.contactEmail}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                <FiMail className="w-4 h-4" />
                {company.contactEmail}
              </a>

              {company.contactPhone && (
                <a href={`tel:${company.contactPhone}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <FiPhone className="w-4 h-4" />
                  {company.contactPhone}
                </a>
              )}

              <div className="flex items-center gap-2">
                <FiUsers className="w-4 h-4" />
                {company.team.length} team member{company.team.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">
            Listings ({listings.length})
          </h2>
          {listings.length > 0 && (
            <Badge variant="outline">Featured Partner</Badge>
          )}
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((property) => (
              <PropertyCard key={property._id} {...property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
            <LuBuilding className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">No listings available yet</p>
            <p className="text-sm text-muted-foreground mt-1">This company hasn&apos;t posted any properties.</p>
          </div>
        )}
      </div>

      {/* Optional: Team Section */}
      {company.team.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <h2 className="text-2xl font-semibold mb-6">Our Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {company.team.map((member, i) => (
              <div key={i} className="bg-card border rounded-2xl p-5 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold mb-3">
                  {member.userId.slice(0, 1).toUpperCase()}
                </div>
                <p className="font-medium">Team Member</p>
                <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}