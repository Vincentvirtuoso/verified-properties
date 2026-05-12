"use client";

import { useState, useMemo, useEffect } from "react";
import { properties } from "@/data/properties";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuSearch,
  LuX,
  LuMapPin,
  LuPhone,
  LuMail,
  LuBuilding,
  LuCircleCheck,
  LuList,
  LuChevronDown,
  LuFilter,
  LuAward,
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

const defaultAgentImage = "/placeholder_agent.png";

const getAllAgents = () => {
  const agentsMap = new Map();

  properties.forEach((property) => {
    if (property.agent && !agentsMap.has(property.agent.id)) {
      const agentProperties = properties.filter(
        (p) => p.agent?.id === property.agent?.id,
      );
      const totalValue = agentProperties.reduce((sum, p) => sum + p.price, 0);
      const activeListings = agentProperties.filter(
        (p) => p.status === "available",
      ).length;

      agentsMap.set(property.agent.id, {
        ...property.agent,
        totalListings: agentProperties.length,
        activeListings,
        totalValue,
        properties: agentProperties,
        locations: [
          ...new Set(agentProperties.map((p) => p.location.split(",")[0])),
        ],
        propertyTypes: [...new Set(agentProperties.map((p) => p.type))],
      });
    }
  });

  return Array.from(agentsMap.values());
};

const agents = getAllAgents();
const locations = [...new Set(agents.flatMap((a) => a.locations))].sort();
const specializations = [
  ...new Set(agents.flatMap((a) => a.propertyTypes)),
].sort();

type SortOption = "name" | "listings" | "experience" | "value";
type ViewMode = "grid" | "list";

export default function AgentsPage() {
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
    setActiveFiltersCount(count);
  }, [selectedLocation, selectedSpecialization, verifiedOnly, searchQuery]);

  const filteredAgents = useMemo(() => {
    let filtered = agents;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(query) ||
          agent.company?.toLowerCase().includes(query) ||
          agent.locations.some((loc: any) =>
            loc.toLowerCase().includes(query),
          ) ||
          agent.propertyTypes.some((type: any) =>
            type.toLowerCase().includes(query),
          ),
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Our Agents
          </h1>
          <p className="text-gray-600 text-lg">
            Connect with experienced real estate professionals across Nigeria
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="relative mb-4">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents by name, company, location, or specialization..."
              className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base
                       focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent
                       transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <LuX className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors"
              >
                <LuFilter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="hidden lg:flex gap-2">
                <Dropdown>
                  <DropdownTrigger className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
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
                    {locations.map((location) => (
                      <DropdownItem
                        key={location}
                        onClick={() => setSelectedLocation(location)}
                      >
                        {location}
                      </DropdownItem>
                    ))}
                  </DropdownContent>
                </Dropdown>

                <Dropdown>
                  <DropdownTrigger className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
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
                    {specializations.map((spec) => (
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
                      ? "bg-violet-600 text-white border-violet-600"
                      : "border-gray-200 hover:bg-gray-50",
                  )}
                >
                  <LuCircleCheck className="w-4 h-4" />
                  Verified Only
                </button>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Dropdown>
                <DropdownTrigger className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
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

              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "grid"
                      ? "bg-violet-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50",
                  )}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "list"
                      ? "bg-violet-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50",
                  )}
                >
                  <LuList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredAgents.length}
            </span>{" "}
            {filteredAgents.length === 1 ? "agent" : "agents"}
            {searchQuery && <span> for "{searchQuery}"</span>}
          </p>
        </div>

        {filteredAgents.length > 0 ? (
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
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <LuSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No agents found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search criteria
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showMobileFilters && (
          <MobileFilterDrawer
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            selectedSpecialization={selectedSpecialization}
            setSelectedSpecialization={setSelectedSpecialization}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={setVerifiedOnly}
            locations={locations}
            specializations={specializations}
            onClose={() => setShowMobileFilters(false)}
            onClear={clearAllFilters}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Grid Agent Card
function AgentCardGrid({ agent }: { agent: any }) {
  const [imgSrc, setImgSrc] = useState(agent.image || defaultAgentImage);

  return (
    <Link href={`/agents/${agent.id}`}>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all group h-full flex flex-col">
        <div className="relative h-48 bg-linear-to-br from-violet-500 to-purple-600">
          <Image
            src={imgSrc}
            alt={agent.name}
            loader={imageLoader}
            fill
            className="object-cover"
            onError={() => setImgSrc(defaultAgentImage)}
          />
          {agent.verified && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-violet-600 flex items-center gap-1">
              <LuCircleCheck className="w-3 h-3" />
              Verified
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
            {agent.name}
          </h3>
          {agent.company && (
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <LuBuilding className="w-3 h-3" />
              {agent.company}
            </p>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Listings:</span>
              <span className="font-semibold text-gray-900">
                {agent.activeListings}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Properties Sold/Rented:</span>
              <span className="font-semibold text-gray-900">
                {agent.totalListings - agent.activeListings}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Specializations:</span>
              <span className="font-semibold text-gray-900">
                {agent.propertyTypes.length}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <LuMapPin className="w-3 h-3 shrink-0" />
              <span className="line-clamp-1">
                {agent.locations.slice(0, 2).join(", ")}
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {agent.phone && (
              <button className="flex-1 py-2 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-100 transition-colors">
                Contact
              </button>
            )}
            <button className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// List Agent Card
function AgentCardList({ agent }: { agent: any }) {
  const [imgSrc, setImgSrc] = useState(agent.image || defaultAgentImage);

  return (
    <Link href={`/agents/${agent.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all group">
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
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-violet-600 transition-colors flex items-center gap-2">
                  {agent.name}
                  {agent.verified && (
                    <LuCircleCheck className="w-4 h-4 text-violet-600" />
                  )}
                </h3>
                {agent.company && (
                  <p className="text-sm text-gray-600">{agent.company}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Listings</p>
                <p className="text-xl font-bold text-violet-600">
                  {agent.activeListings}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <LuMapPin className="w-4 h-4" />
                <span>{agent.locations.slice(0, 2).join(", ")}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <LuHouse className="w-4 h-4" />
                <span>{agent.propertyTypes.slice(0, 3).join(", ")}</span>
              </div>
              {agent.phone && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
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

// Mobile Filter Drawer
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
}: any) {
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
        className="absolute right-0 top-0 h-full w-full max-w-xs bg-white shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="all">All Locations</option>
              {locations.map((loc: string) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Type
            </label>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="all">All Types</option>
              {specializations.map((spec: string) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">
                Verified Agents Only
              </span>
              <button
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  verifiedOnly ? "bg-violet-600" : "bg-gray-200",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                    verifiedOnly ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </label>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClear}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
