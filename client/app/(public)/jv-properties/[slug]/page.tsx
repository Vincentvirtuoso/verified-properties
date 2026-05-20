"use client";

import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { MOCK_JV_PROPERTIES } from "@/data/mock-jv-properties";
import { imageLoader } from "@/utils/helpers";
import {
  LuMapPin,
  LuUser,
  LuExternalLink,
  LuPercent,
  LuHandshake,
} from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCompactPrice } from "@/lib/formatters";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";

export default function JvPropertyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const property = MOCK_JV_PROPERTIES.find((p) => p.slug === slug);
  if (!property) return notFound();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "JV Properties", href: "/jv-properties" },
            { label: property.title, href: `/jv-properties/${property.slug}` },
          ]}
        />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden">
              <Image
                src={property.image || "/placeholder-property.png"}
                alt={property.title}
                fill
                className="object-cover"
                loader={imageLoader}
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
              />
            </div>
            {property.gallery && property.gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {property.gallery.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative h-24 rounded overflow-hidden"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `${property.title} ${idx + 1}`}
                      fill
                      className="object-cover"
                      loader={imageLoader}
                      sizes="25vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-muted">
                <LuMapPin className="w-4 h-4" />
                <span>
                  {property.location.address}, {property.location.city},{" "}
                  {property.location.state}, {property.location.country}
                </span>
              </div>
              {property.googlePin && (
                <a
                  href={property.googlePin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                >
                  <LuExternalLink className="w-3 h-3" />
                  View on Google Maps
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="text-xs text-muted">Land Value</p>
                <p className="font-bold text-lg">
                  {formatCompactPrice(property.landValue || 0)}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="text-xs text-muted">ROI</p>
                <p className="font-bold text-lg text-primary">
                  {property.roi}%
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="text-xs text-muted">Land Size</p>
                <p className="font-bold text-lg">
                  {property.landSize || "N/A"}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="text-xs text-muted">Duration</p>
                <p className="font-bold text-lg">
                  {property.investmentDuration}
                </p>
              </div>
            </div>

            {property.purposeDescription && (
              <div>
                <h3 className="font-semibold text-foreground mb-1">Purpose</h3>
                <p className="text-muted">{property.purposeDescription}</p>
              </div>
            )}
            {property.description && (
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Description
                </h3>
                <p className="text-muted">{property.description}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <LuHandshake className="w-4 h-4 text-primary" />
                  Sharing Formula
                </h3>
                <p className="text-lg font-bold">
                  {property.sharingFormula || "N/A"}
                </p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <LuPercent className="w-4 h-4 text-primary" />
                  Facilitator Fee
                </h3>
                {property.facilitatorFee ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      Total:{" "}
                      <span className="font-bold">
                        {property.facilitatorFee.totalPercentage}%
                      </span>
                    </p>
                    <p className="text-muted">
                      Developer: {property.facilitatorFee.developerShare}% |
                      Owner: {property.facilitatorFee.ownerShare}%
                    </p>
                    <p>
                      {property.facilitatorFee.negotiable
                        ? "Negotiable"
                        : "Non‑negotiable"}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted">N/A</p>
                )}
              </div>
            </div>

            {(property.premium !== undefined ||
              property.minimumInvestment !== undefined) && (
              <div className="flex flex-wrap gap-4">
                {property.premium !== undefined && (
                  <div>
                    <p className="text-xs text-muted">Premium</p>
                    <p className="font-semibold">
                      {formatCompactPrice(property.premium || 0)}
                    </p>
                  </div>
                )}
                {property.minimumInvestment !== undefined &&
                  property.minimumInvestment > 0 && (
                    <div>
                      <p className="text-xs text-muted">Minimum Investment</p>
                      <p className="font-semibold">
                        {formatCompactPrice(property.minimumInvestment || 0)}
                      </p>
                    </div>
                  )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <LuUser className="w-4 h-4 text-muted" />
                <span className="text-sm capitalize">
                  {property.ownerType} (ID:{" "}
                  {typeof property.ownerId === "object"
                    ? property.ownerId.name
                    : property.ownerId}
                  )
                </span>
              </div>
              <Badge
                variant={property.status === "active" ? "success" : "secondary"}
              >
                {property.status}
              </Badge>
              {property.category && (
                <Badge variant="outline">{property.category}</Badge>
              )}
            </div>

            <div className="pt-4">
              <Button size="lg" className="w-full sm:w-auto">
                Express Interest
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
