"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuSearch,
  LuX,
  LuMapPin,
  LuPhone,
  LuBuilding,
  LuCircleCheck,
  LuList,
  LuChevronDown,
  LuFilter,
  LuHouse,
} from "react-icons/lu";
import { FiGrid } from "react-icons/fi";
import { imageLoader } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import { Breadcrumbs, BreadcrumbSchema } from "@/components/common/BreadCrumbs";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/Dropdown";
import { Checkbox } from "@/components/ui/Checkbox";
import { fetchDirectoryAgents, type DirectoryAgent } from "@/lib/supabase/publicDirectory";

export type Agent = DirectoryAgent;

const defaultAgentImage = "/placeholder_avatar.png";

type SortOption = "name" | "listings" | "experience" | "value";
type ViewMode = "grid" | "list";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDirectoryAgents()
      .then((rows) => !cancelled && setAgents(rows))
      .catch(() => !cancelled && setLoadError("Couldn't load agents. Please refresh."));
    return () => {
      cancelled = true;
    };
  }, []);

  const allLocations = useMemo(
    () => [...new Set((agents ?? []).flatMap((a) => a.locations))].sort(),
    [agents],
  );
  const allSpecializations = useMemo(
    () => [...new Set((agents ?? []).flatMap((a) => a.propertyTypes))].sort(),
    [agents],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("listings");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    let count = 0;
    if (selectedLocation !== "all") count++;
    if (selectedSpecialization !== "all") count++;
    if (verifiedOnly) count++;
    if (searchQuery) count++;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveFiltersCount(count);
  }, [selectedLocation, selectedSpecialization, verifiedOnly, searchQuery]);

  const filteredAgents = useMemo(() => {
    let filtered = [...(agents ?? [])];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(q) ||
          agent.company?.toLowerCase().includes(q) ||
          agent.locations.some((loc) => loc.toLowerCase().includes(q)) ||
          agent.propertyTypes.some((type) => type.toLowerCase().includes(q)),
      );
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter((agent) =>
        agent.locations.includes(selectedLocation),
      );
    }

    if (selectedSpecialization !== "all") {
      filtered = filtered.filter((agent) =>
        agent.propertyTypes.includes(selectedSpecialization),
      );
    }

    if (verifiedOnly) {
      filtered = filtered.filter((agent) => agent.verified);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "listings":
          return b.activeListings - a.activeListings;
        case "value":
          return b.totalValue - a.totalValue;
        case "experience":
          return b.totalListings - a.totalListings;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    searchQuery,
    selectedLocation,
    selectedSpecialization,
    verifiedOnly,
    sortBy,
    agents,
  ]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedLocation("all");
    setSelectedSpecialization("all");
    setVerifiedOnly(false);
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Agents", href: "/agents" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Breadcrumbs
            items={breadcrumbItems}
            variant="bordered"
            size="md"
            className="border-0! bg-transparent!"
          />
          <BreadcrumbSchema items={breadcrumbItems} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Our Agents
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect with experienced real estate professionals across Nigeria
          </p>
        </div>

        {/* Search & Controls */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <div className="relative mb-4">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents by name, company, location, or specialization..."
              className="w-full pl-12 pr-12 py-3 bg-background border border-border rounded-xl text-base
                         focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                         transition-all text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full transition-colors"
              >
                <LuX className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <LuFilter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Desktop Filters */}
              <div className="hidden lg:flex gap-2">
                <Dropdown>
                  <DropdownTrigger className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-sm text-foreground">
                    <LuMapPin className="w-4 h-4" />
                    {selectedLocation === "all"
                      ? "All Locations"
                      : selectedLocation}
                    <LuChevronDown className="w-4 h-4" />
                  </DropdownTrigger>
                  <DropdownContent className="max-h-64 overflow-y-auto">
                    <DropdownItem onClick={() => setSelectedLocation("all")}>
                      All Locations
                    </DropdownItem>
                    {allLocations.map((loc) => (
                      <DropdownItem
                        key={loc}
                        onClick={() => setSelectedLocation(loc)}
                      >
                        {loc}
                      </DropdownItem>
                    ))}
                  </DropdownContent>
                </Dropdown>

                <Dropdown>
                  <DropdownTrigger className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-sm text-foreground">
                    <LuBuilding className="w-4 h-4" />
                    {selectedSpecialization === "all"
                      ? "All Types"
                      : selectedSpecialization}
                    <LuChevronDown className="w-4 h-4" />
                  </DropdownTrigger>
                  <DropdownContent className="max-h-64 overflow-y-auto">
                    <DropdownItem
                      onClick={() => setSelectedSpecialization("all")}
                    >
                      All Property Types
                    </DropdownItem>
                    {allSpecializations.map((spec) => (
                      <DropdownItem
                        key={spec}
                        onClick={() => setSelectedSpecialization(spec)}
                      >
                        {spec}
                      </DropdownItem>
                    ))}
                  </DropdownContent>
                </Dropdown>

                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={cn(
                    "px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 text-sm",
                    verifiedOnly
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary text-foreground",
                  )}
                >
                  <LuCircleCheck className="w-4 h-4" />
                  Verified Only
                </button>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Dropdown>
                <DropdownTrigger className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 text-sm text-foreground">
                  Sort:{" "}
                  {sortBy === "name"
                    ? "Name"
                    : sortBy === "listings"
                      ? "Most Listings"
                      : sortBy === "value"
                        ? "Highest Value"
                        : "Most Experienced"}
                  <LuChevronDown className="w-4 h-4" />
                </DropdownTrigger>
                <DropdownContent>
                  <DropdownItem onClick={() => setSortBy("name")}>
                    Name (A-Z)
                  </DropdownItem>
                  <DropdownItem onClick={() => setSortBy("listings")}>
                    Most Active Listings
                  </DropdownItem>
                  <DropdownItem onClick={() => setSortBy("value")}>
                    Highest Portfolio Value
                  </DropdownItem>
                  <DropdownItem onClick={() => setSortBy("experience")}>
                    Most Experienced
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>

              <div className="flex border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <LuList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Result Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredAgents.length}
            </span>{" "}
            {filteredAgents.length === 1 ? "agent" : "agents"}
            {searchQuery && <span> for &quot;{searchQuery}&quot;</span>}
          </p>
        </div>

        {/* Agent List */}
        {loadError ? (
          <p role="alert" className="py-16 text-center text-destructive">{loadError}</p>
        ) : !agents ? (
          <p className="py-16 text-center text-muted-foreground">Loading agents…</p>
        ) : filteredAgents.length > 0 ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4",
            )}
          >
            {filteredAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {viewMode === "grid" ? (
                  <AgentCardGrid agent={agent} />
                ) : (
                  <AgentCardList agent={agent} />
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <LuSearch className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No agents found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search criteria
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <MobileFilterDrawer
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            selectedSpecialization={selectedSpecialization}
            setSelectedSpecialization={setSelectedSpecialization}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={setVerifiedOnly}
            locations={allLocations}
            specializations={allSpecializations}
            onClose={() => setShowMobileFilters(false)}
            onClear={clearAllFilters}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AgentCardGrid({ agent }: { agent: Agent }) {
  const [imgSrc, setImgSrc] = useState(agent.image || defaultAgentImage);

  return (
    <Link href={`/agents/${agent.id}`}>
      <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all group h-full flex flex-col">
        <div className="relative h-48 bg-linear-to-br from-primary to-primary/80">
          <Image
            src={imgSrc}
            alt={agent.name}
            loader={imageLoader}
            fill
            className="object-cover"
            onError={() => setImgSrc(defaultAgentImage)}
          />
          {agent.verified && (
            <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-primary flex items-center gap-1">
              <LuCircleCheck className="w-3 h-3" />
              Verified
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {agent.name}
          </h3>
          {agent.company && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <LuBuilding className="w-3 h-3" />
              {agent.company}
            </p>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Listings:</span>
              <span className="font-semibold text-foreground">
                {agent.activeListings}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Deals:</span>
              <span className="font-semibold text-foreground">
                {agent.totalListings}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Specializations:</span>
              <span className="font-semibold text-foreground">
                {agent.propertyTypes.length}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LuMapPin className="w-3 h-3 shrink-0" />
              <span className="line-clamp-1">
                {agent.locations.slice(0, 2).join(", ")}
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {agent.phone && (
              <button className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                Contact
              </button>
            )}
            <button className="flex-1 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function AgentCardList({ agent }: { agent: Agent }) {
  const [imgSrc, setImgSrc] = useState(agent.image || defaultAgentImage);

  return (
    <Link href={`/agents/${agent.id}`}>
      <div className="bg-card rounded-xl border border-border p-4 hover:shadow-lg transition-all group">
        <div className="flex items-start gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0">
            <Image
              src={imgSrc}
              alt={agent.name}
              loader={imageLoader}
              fill
              className="object-cover"
              onError={() => setImgSrc(defaultAgentImage)}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                  {agent.name}
                  {agent.verified && (
                    <LuCircleCheck className="w-4 h-4 text-primary" />
                  )}
                </h3>
                {agent.company && (
                  <p className="text-sm text-muted-foreground">
                    {agent.company}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Listings</p>
                <p className="text-xl font-bold text-primary">
                  {agent.activeListings}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <LuMapPin className="w-4 h-4" />
                <span>{agent.locations.slice(0, 2).join(", ")}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <LuHouse className="w-4 h-4" />
                <span>{agent.propertyTypes.slice(0, 3).join(", ")}</span>
              </div>
              {agent.phone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <LuPhone className="w-4 h-4" />
                  <span>{agent.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MobileFilterDrawer({
  selectedLocation,
  setSelectedLocation,
  selectedSpecialization,
  setSelectedSpecialization,
  verifiedOnly,
  setVerifiedOnly,
  locations,
  specializations,
  onClose,
  onClear,
}: {
  selectedLocation: string;
  setSelectedLocation: (v: string) => void;
  selectedSpecialization: string;
  setSelectedSpecialization: (v: string) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  locations: string[];
  specializations: string[];
  onClose: () => void;
  onClear: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 lg:hidden"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30 }}
        className="absolute right-0 top-0 h-full w-full max-w-xs bg-card shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Property Type
            </label>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Types</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <Checkbox
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              label="Verified Agents Only"
            />
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClear}
              className="flex-1 py-3 border border-border text-foreground rounded-lg hover:bg-secondary transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
