"use client";

import { MOCK_JV_PROPERTIES } from "@/data/mock-jv-properties";
import Image from "next/image";
import Link from "next/link";
import { imageLoader } from "@/utils/helpers";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";

export default function JvPropertiesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[{ label: "JV Properties", href: "/jv-properties" }]}
        />

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          All Joint Venture Properties
        </h1>
        <p className="text-muted max-w-2xl mb-8">
          Browse current joint‑venture opportunities. Find the right project
          that matches your investment goals.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_JV_PROPERTIES.map((property) => (
            <Link
              key={property._id}
              href={`/jv-properties/${property.slug}`}
              className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={property.image || "/placeholder-property.png"}
                  alt={property.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  loader={imageLoader}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-primary">
                  ROI {property.roi}%
                </div>
                {property.landSize && (
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    {property.landSize}
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                  {property.title}
                </h3>
                <p className="text-sm text-muted mb-2">
                  {property.location.city}, {property.location.state}
                </p>
                <div className="flex items-center gap-2 mb-3 text-xs text-muted">
                  {property.sharingFormula && (
                    <span className="bg-muted/20 px-2 py-0.5 rounded">
                      {property.sharingFormula}
                    </span>
                  )}
                  {property.facilitatorFee && (
                    <span className="bg-muted/20 px-2 py-0.5 rounded">
                      Fee {property.facilitatorFee.totalPercentage}%
                    </span>
                  )}
                </div>
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-primary">
                      {property.landValue
                        ? `₦${property.landValue.toLocaleString()}`
                        : `₦${property.minimumInvestment.toLocaleString()} min`}
                    </span>
                    <span className="text-muted">
                      {property.investmentDuration}
                    </span>
                  </div>
                  {property.totalInvestors !== undefined && (
                    <div className="mt-2 text-xs text-muted">
                      {property.totalInvestors}/{property.maxInvestors ?? "∞"}{" "}
                      investors
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
