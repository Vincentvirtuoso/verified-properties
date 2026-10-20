"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@affilhomes/shared/ui/Button";
import { FaSearch, FaArrowDown } from "react-icons/fa";
import { fetchFeaturedProperties, fetchStats } from "@/lib/api";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { PopulatedProperty, Stats } from "@affilhomes/shared/types";
import StatsAndPartners from "@/components/home/StatsAndPatners";
import QuickActions from "@/components/home/QuickActions";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { AICallingSpotlight } from "@/components/home/AICallingSpotlight";
import { HomeSearchModal } from "@/components/home/HomeSearchModal";
import { properties } from "@/data/properties";
import { VerificationStrip } from "@/components/home/VerificationStrip";
import { PopularAreas } from "@/components/home/PopularAreas";

export default function HomePage() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const [featuredProperties, setFeaturedProperties] = useState<
    PopulatedProperty[]
  >([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const data = await fetchFeaturedProperties();
        if (data.length === 0) {
          setFeaturedProperties(
            properties.filter((property) => property.tier === "featured"),
          );
        } else {
          setFeaturedProperties(data);
        }
      } catch (err) {
        setPropertyError(
          "Could not load featured properties. Please try again.",
        );
        console.error(err);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    const loadStats = async () => {
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadFeatured();
    loadStats();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openSearch = useCallback(() => setSearchModalOpen(true), []);
  const closeSearch = useCallback(() => setSearchModalOpen(false), []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <HeroCarousel />

      <div className="relative z-20 -mt-6 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => e.preventDefault()}
            role="search"
            aria-label="Property search"
          >
            <div className="bg-card rounded-2xl shadow-xl px-2 flex items-center border border-border">
              <input
                type="text"
                readOnly
                onFocus={openSearch}
                onClick={openSearch}
                placeholder="Search properties, locations..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted text-lg py-3 px-4 cursor-pointer"
                aria-label="Open property search"
                aria-haspopup="dialog"
              />
              <Button
                type="button"
                size="lg"
                onClick={openSearch}
                aria-label="Open property search"
                aria-haspopup="dialog"
              >
                <FaSearch />
              </Button>
            </div>
          </form>
        </div>
      </div>
      <PopularAreas />
      <FeaturedProperties
        properties={featuredProperties}
        propertyError={propertyError}
        isLoading={isLoadingProperties}
      />

      <VerificationStrip />

      <QuickActions />
      <AICallingSpotlight />

      <StatsAndPartners stats={stats} isLoading={isLoadingStats} />

      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <FaArrowDown className="rotate-180 w-5 h-5" />
        </button>
      )}

      <HomeSearchModal open={searchModalOpen} onClose={closeSearch} />
    </>
  );
}
