"use client";

import { useState, useMemo } from "react";
import Select from "@/components/ui/Select";
import { CompanyCard } from "./CompanyCard";
import { Company, CompanyType, companyTypeLabels } from "@/types/company";
import { Field } from "@/components/ui/Field";

interface Props {
  initialCompanies: Company[];
}

export function CompanyDirectory({ initialCompanies }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CompanyType | "all">("all");

  const filtered = useMemo(() => {
    return initialCompanies.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || c.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [initialCompanies, search, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Field
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          name="search"
          label="Search"
        />
        <Select
          label=""
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as CompanyType | "all")}
          options={Object.entries(companyTypeLabels).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        {/* <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(companyTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select> */}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length}{" "}
        {filtered.length === 1 ? "company" : "companies"}
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((company) => (
          <CompanyCard key={company._id} company={company} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No companies found. Try adjusting your search or filter.
        </div>
      )}
    </div>
  );
}
