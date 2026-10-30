"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { LuBuilding2, LuCircleCheck, LuMail, LuPhone } from "react-icons/lu";
import type { Company, PopulatedProperty } from "@affilhomes/shared/types";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { PropertyCard } from "@/components/property/PropertyCard";
import { imageLoader } from "@/utils";
import { cn } from "@/lib/utils";
import { Avatar } from "@affilhomes/shared/ui";

const DEFAULT_LOGO = "/placeholder_avatar.png";

/** Public-safe view of an agent. Built on the server. Never pass raw team rows. */
export interface PublicAgent {
  id: string;
  name: string;
  avatar: string | null;
  subRole: string | null;
  verified: boolean;
}

const mockAgent: PublicAgent[] = [
  {
    id: "1",
    name: "Dani Olmo",
    avatar: "/og-properties.jpg",
    subRole: "Realtor",
    verified: true,
  },
];

type Tab = "listings" | "agents";

export function CompanyClient({
  company,
  agents,
  listings,
}: {
  company: Company;
  agents: PublicAgent[];
  listings: PopulatedProperty[];
}) {
  const [tab, setTab] = useState<Tab>("listings");
  const [logoSrc, setLogoSrc] = useState(company.logo || DEFAULT_LOGO);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "listings", label: "Listings", count: listings.length },
    { key: "agents", label: "Agents", count: agents.length },
  ];

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setTab(next.key);
    document.getElementById(`tab-${next.key}`)?.focus();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Companies", href: "/companies" },
            { label: company.name },
          ]}
        />
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-start gap-6 md:flex-row">
            <Avatar
              src={logoSrc}
              alt={`${company.name} logo`}
              size={96}
              name={company.name}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {company.name}
                </h1>
                {company.verificationStatus === "verified" && (
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

              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {company.contactEmail && (
                  <li>
                    <a
                      href={`mailto:${company.contactEmail}`}
                      className="flex items-center gap-1.5 transition-colors hover:text-primary"
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
                      className="flex items-center gap-1.5 transition-colors hover:text-primary"
                    >
                      <LuPhone className="h-4 w-4" aria-hidden="true" />
                      {company.contactPhone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6">
            <div className="text-center sm:text-left">
              <dt className="text-sm text-muted">Active listings</dt>
              <dd className="mt-1 text-2xl font-bold text-foreground">
                {listings.length}
              </dd>
            </div>
            <div className="text-center sm:text-left">
              <dt className="text-sm text-muted">Agents</dt>
              <dd className="mt-1 text-2xl font-bold text-foreground">
                {agents.length}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div
          role="tablist"
          aria-label="Company details"
          className="mb-6 flex gap-2 border-b border-border"
        >
          {tabs.map((t, index) => {
            const selected = tab === t.key;
            return (
              <button
                key={t.key}
                id={`tab-${t.key}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`panel-${t.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t.key)}
                onKeyDown={(e) => onTabKeyDown(e, index)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((property) => (
                  <PropertyCard key={property._id} {...property} />
                ))}
              </div>
            ) : (
              <EmptyPanel
                title="No active listings"
                description="This company doesn't have any properties listed right now."
              />
            )}
          </div>
        )}

        {tab === "agents" && (
          <div id="panel-agents" role="tabpanel" aria-labelledby="tab-agents">
            {agents.length > 0 ? (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </ul>
            ) : (
              <EmptyPanel
                title="No agents yet"
                description="No agents are currently linked to this company."
              />
            )}
            {mockAgent.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: PublicAgent }) {
  return (
    <li>
      <Link
        href={`/agents/${agent.id}`}
        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar
          src={agent.avatar}
          name={agent.name}
          fallbackSrc={DEFAULT_LOGO}
          size={48}
          className="object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-semibold text-foreground transition-colors group-hover:text-primary">
            {agent.name}
            {agent.verified && (
              <>
                <LuCircleCheck
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="sr-only"> (verified)</span>
              </>
            )}
          </p>
          {agent.subRole && (
            <p className="text-sm capitalize text-muted">{agent.subRole}</p>
          )}
        </div>
      </Link>
    </li>
  );
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted/30 text-muted">
        <LuBuilding2 className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-muted">{description}</p>
    </section>
  );
}
