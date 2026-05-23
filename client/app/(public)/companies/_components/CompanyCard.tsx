"use client";

import Link from "next/link";
import {
  LuBuilding2 as Building2,
  LuMail as Mail,
  LuPhone as Phone,
  LuBadgeCheck as BadgeCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Company, companyTypeLabels } from "@/types/company";

export function CompanyCard({ company }: { company: Company }) {
  const accentColors = {
    real_estate_company: "bg-blue-50 text-blue-700 ring-blue-500/20",
    developer: "bg-violet-50 text-violet-700 ring-violet-500/20",
    broker: "bg-amber-50 text-amber-700 ring-amber-500/20",
  };

  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group block rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {company.logo ? (
            <img
              src={company.logo}
              alt={`${company.name} logo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
            {company.name}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                accentColors[company.type],
              )}
            >
              {companyTypeLabels[company.type]}
            </span>
            {company.verificationStatus === "verified" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-medium ring-1 ring-success/20">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span>{company.activeListings} listings</span>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground truncate">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{company.contactEmail}</span>
        </div>
        {company.contactPhone && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{company.contactPhone}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
