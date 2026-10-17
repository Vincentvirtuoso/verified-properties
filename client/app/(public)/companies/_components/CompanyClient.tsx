"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LuBuilding2,
  LuCircleCheck,
  LuGlobe,
  LuMail,
  LuMapPin,
  LuPhone,
} from "react-icons/lu";
import type { Company, CompanyMember, PopulatedProperty } from "@affilhomes/shared/types";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { PropertyCard } from "@/components/property/PropertyCard";
import { imageLoader } from "@/utils";
import { cn } from "@/lib/utils";

const DEFAULT_LOGO = "/placeholder_avatar.png";



type Tab = "listings" | "agents";

export function CompanyClient({
  company,
  agents,
  listings,
}: {
  company: Company;
  agents: CompanyMember[];
  listings: PopulatedProperty[];
}) {
  const [tab, setTab] = useState<Tab>("listings");
  const [logoSrc, setLogoSrc] = useState(company.logo || DEFAULT_LOGO);

  const totalEnquiries = listings.reduce(
    (sum, p) => sum + (p.totalInquiries || 0),
    0,
  );

  const stats = [
    { label: "Active listings", value: listings.length },
    { label: "Agents", value: agents.length },
    { label: "Enquiries", value: totalEnquiries },
  ];

  const breadcrumbItems = [
    { label: "Companies", href: "/company" },
    { label: company.name, href: `/company/${company._id}` },
  ];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "listings", label: "Listings", count: listings.length },
    { key: "agents", label: "Agents", count: agents.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Header card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30">
              <Image
                src={logoSrc}
                alt={`${company.name} logo`}
                fill
                loader={imageLoader}
                onError={() => setLogoSrc(DEFAULT_LOGO)}
                className="object-contain p-2"
              />
            </div>

            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {company.name}
                </h1>
                {company.verificationStatus==="verified" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <LuCircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Verified
                  </span>
                )}
              </div>

              {company.createdAt && (
                <p className="mt-1 text-sm text-muted">
                  Established {new Date(company.createdAt).toLocaleDateString()}
                </p>
              )}

              {/* {company.description && (
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed max-w-3xl">
                  {company.description}
                </p>
              )} */}

              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {/* {company. && (
                  <li className="flex items-center gap-1.5">
                    <LuMapPin className="h-4 w-4" aria-hidden="true" />
                    {company.address}
                  </li>
                )} */}
                {company.contactEmail && (
                  <li>
                    <a
                      href={`mailto:${company.contactEmail}`}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <LuMail className="h-4 w-4" aria-hidden="true" />
                      {company.contactEmail}
                    </a>
                  </li>
                )}
                {company.contactPhone && (
                  <li>
                    <a
                      href={`tel:${company.contactPhone}`}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <LuPhone className="h-4 w-4" aria-hidden="true" />
                      {company.contactPhone}
                    </a>
                  </li>
                )}
                {/* {company.website && (
                  <li>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <LuGlobe className="h-4 w-4" aria-hidden="true" />
                      Website
                    </a>
                  </li>
                )} */}
              </ul>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <dt className="text-sm text-muted">{s.label}</dt>
                <dd className="mt-1 text-2xl font-bold text-foreground">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Tabs and content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-16">
        <div
          role="tablist"
          aria-label="Company details"
          className="flex gap-2 border-b border-border mb-6"
        >
          {tabs.map((t) => {
            const selected = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                type="button"
                id={`tab-${t.key}`}
                aria-selected={selected}
                aria-controls={`panel-${t.key}`}
                onClick={() => setTab(t.key)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  selected
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                {t.label}
                <span className="ml-2 rounded-full bg-muted/30 px-2 py-0.5 text-xs">
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "listings" && (
          <div
            id="panel-listings"
            role="tabpanel"
            aria-labelledby="tab-listings"
          >
            {listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((property) => (
                  <PropertyCard key={property._id} {...property} />
                ))}
              </div>
            ) : (
              <EmptyPanel
                icon={LuBuilding2}
                title="No active listings"
                description="This company doesn't have any properties listed right now."
              />
            )}
          </div>
        )}

        {tab === "agents" && (
          <div id="panel-agents" role="tabpanel" aria-labelledby="tab-agents">
            {agents.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <AgentRow key={agent.userId} agent={agent} />
                ))}
              </ul>
            ) : (
              <EmptyPanel
                icon={LuBuilding2}
                title="No agents yet"
                description="No agents are currently linked to this company."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentRow({ agent }: { agent: CompanyMember }) {
  const [src, setSrc] = useState( DEFAULT_LOGO);

  return (
    <li>
      <Link
        href={`/agents/${agent.userId}`}
        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
      </Link>
    </li>
  );
}
        // <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted/30">
        //   <Image
        //     src={src}
        //     alt=""
        //     fill
        //     loader={imageLoader}
        //     onError={() => setSrc(DEFAULT_LOGO)}
        //     className="object-cover"
        //   />
        // </div>
        // <div className="min-w-0 flex-1">
        //   <p className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
        //     {agent.userId}
        //     {/* {agent.verified && (
        //       <>
        //         <LuCircleCheck
        //           className="ml-1.5 inline h-4 w-4 text-primary"
        //           aria-hidden="true"
        //         />
        //         <span className="sr-only"> (verified)</span>
        //       </>
        //     )}
        //   </p>
        //   <p className="text-sm text-muted">
        //     {agent.activeListings ?? 0} active{" "}
        //     {agent.activeListings === 1 ? "listing" : "listings"}
        //   </p> */}
        // </div>

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <Icon className="h-7 w-7" aria-hidden={true} />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-muted">{description}</p>
    </section>
  );
}
