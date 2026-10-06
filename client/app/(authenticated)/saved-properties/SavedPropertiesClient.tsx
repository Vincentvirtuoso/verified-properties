"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowUpRight,
  FiHeart,
  FiSearch,
  FiSliders,
  FiX,
} from "react-icons/fi";
import { LuBookmark, LuHouse } from "react-icons/lu";

import { cn } from "@/lib/utils";
import { SavedProperty } from "@/types";
import { PropertyCard } from "@/components/property/PropertyCard";
import { NoResults } from "@/components/propertiesList/NoResults";
import {
  SAVED_PROPERTIES_EVENT,
  SAVED_PROPERTIES_STORAGE_KEY,
  getSavedEntries,
} from "@/lib/saved-properties-storage";
import { properties as allProperties } from "@/data/properties";

interface SavedPropertiesClientProps {
  initialProperties?: SavedProperty[];
}

type Filter = "all" | "sale" | "rent";

const propertyBySlug = new Map(
  allProperties.map((property) => [property.slug, property]),
);

function readSavedFromStorage(): SavedProperty[] {
  if (typeof window === "undefined") return [];

  return getSavedEntries()
    .map(({ slug, savedAt }) => {
      const property = propertyBySlug.get(slug);
      if (!property) return null;
      return { ...property, savedAt } as SavedProperty;
    })
    .filter((p): p is SavedProperty => p !== null)
    .sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );
}

export default function SavedPropertiesClient({
  initialProperties = [],
}: SavedPropertiesClientProps) {
  const [properties, setProperties] =
    useState<SavedProperty[]>(initialProperties);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const refresh = useCallback(() => {
    setProperties(readSavedFromStorage());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVED_PROPERTIES_STORAGE_KEY) refresh();
    };
    const onLocal = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener(SAVED_PROPERTIES_EVENT, onLocal);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SAVED_PROPERTIES_EVENT, onLocal);
    };
  }, [refresh]);

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return properties.filter((property) => {
      const location = property.location
        ? `${property.location.city}, ${property.location.state}`
        : "";

      const matchesSearch =
        !query ||
        property.title.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "sale" && property.listingPurpose === "sale") ||
        (filter === "rent" && property.listingPurpose === "rent");

      return matchesSearch && matchesFilter;
    });
  }, [properties, search, filter]);

  const hasProperties = properties.length > 0;
  const hasResults = filteredProperties.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Saved properties
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Keep track of properties you love and come back to them when
                you&apos;re ready.
              </p>
            </div>

            {hasProperties && (
              <div className="flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-2 text-sm shadow-sm sm:self-auto">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LuBookmark size={15} />
                </span>

                <span className="font-semibold text-foreground">
                  {properties.length}
                </span>

                <span className="text-muted-foreground">
                  {properties.length === 1 ? "property" : "properties"}
                </span>
              </div>
            )}
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {hasProperties ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mb-7"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <FiSearch
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search saved properties..."
                      aria-label="Search saved properties"
                      className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden items-center gap-2 rounded-xl border border-border bg-card p-1 sm:flex">
                      {[
                        { value: "all", label: "All" },
                        { value: "sale", label: "For sale" },
                        { value: "rent", label: "For rent" },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFilter(item.value as Filter)}
                          className={cn(
                            "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                            filter === item.value
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFilters((s) => !s)}
                      aria-expanded={showFilters}
                      aria-label="Toggle filters"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground sm:hidden"
                    >
                      {showFilters ? <FiX /> : <FiSliders />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden sm:hidden"
                    >
                      <div className="mt-3 flex gap-2 rounded-full border border-border bg-card p-1">
                        {[
                          { value: "all", label: "All" },
                          { value: "sale", label: "For sale" },
                          { value: "rent", label: "For rent" },
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setFilter(item.value as Filter);
                              setShowFilters(false);
                            }}
                            className={cn(
                              "flex-1 rounded-full px-3 py-2 text-sm font-medium transition",
                              filter === item.value
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted/30",
                            )}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              {hasResults && (
                <div className="mb-5">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {filteredProperties.length}
                    </span>{" "}
                    {filteredProperties.length === 1
                      ? "property"
                      : "properties"}
                  </p>
                </div>
              )}

              {hasResults ? (
                <motion.div
                  layout
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredProperties.map((property, index) => (
                    <motion.div
                      key={property.slug}
                      layout
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(index * 0.04, 0.2),
                      }}
                    >
                      <PropertyCard {...property} isSaved />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <NoResults
                  search={search}
                  onClear={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                />
              )}
            </motion.div>
          ) : (
            <EmptySavedProperties key="empty" />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function EmptySavedProperties() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[55vh] items-center justify-center"
    >
      <div className="mx-auto max-w-md text-center">
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <FiHeart size={34} strokeWidth={1.7} />

          <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-background bg-card text-muted-foreground shadow-sm">
            <LuHouse size={13} />
          </span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Nothing saved yet
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Properties you save will appear here, making it easy to compare and
          revisit your favourites.
        </p>

        <a
          href="/properties"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Explore properties
          <FiArrowUpRight />
        </a>
      </div>
    </motion.section>
  );
}
