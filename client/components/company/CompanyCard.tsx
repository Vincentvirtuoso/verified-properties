"use client";

import { useRouter } from "next/navigation";
import {
  LuBuilding2 as Building2,
  LuMail as Mail,
  LuPhone as Phone,
  LuUsers,
} from "react-icons/lu";
import { Company } from "@affilhomes/shared/types";
import {
  Avatar,
  InfoRow,
  LockedBadge,
  VerifiedBadge,
} from "@affilhomes/shared/ui";
import { BiBuildings } from "react-icons/bi";
import { formatPhoneNumber } from "@/utils";

export function CompanyCard({ company }: { company: Company }) {
  const router = useRouter();
  const teamMembers = company.team.length;
  const href = `/companies/${company.slug}`;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
      className="group block min-w-0 cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <Avatar
          src={company.logo}
          name={company.name}
          fallbackIcon={<Building2 />}
          alt={`${company.name} logo`}
        />

        <div className="min-w-0 flex-1">
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold transition-colors group-hover:text-primary">
              {company.name}
            </h3>
            {company.verificationStatus === "verified" && <VerifiedBadge />}
          </div>

          <LockedBadge company={company} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-end gap-1.5 text-sm text-muted">
          <BiBuildings className="h-5 w-5" />
          <span className="text-xs">{company.activeListings} listings</span>
        </div>
        <div className="flex items-end gap-1.5 text-sm text-muted">
          <LuUsers className="h-5 w-5" />
          <span className="text-xs">{teamMembers} Members</span>
        </div>
      </div>

      <div className="mt-4 min-w-0 space-y-1.5 text-sm">
        <InfoRow
          icon={Mail}
          label="Contact Email"
          value={company.contactEmail}
          hideLabelOnMobile={false}
          href={`mailto:${company.contactEmail}`}
        />
        {company.contactPhone && (
          <InfoRow
            icon={Phone}
            label="Contact Phone"
            value={formatPhoneNumber(company.contactPhone)}
            hideLabelOnMobile={false}
            href={`tel:${company.contactPhone}`}
          />
        )}
      </div>
    </div>
  );
}
