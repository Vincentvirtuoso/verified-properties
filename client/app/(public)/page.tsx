"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { FaSearch, FaArrowDown, FaStar } from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
  fetchFeaturedProperties,
  fetchStats,
  fetchTestimonials,
} from "@/lib/api";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { PopulatedProperty, Stats, Testimonial } from "@/types";
import StatsAndPartners from "@/components/home/StatsAndPatners";
import QuickActions from "@/components/home/QuickActions";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { AICallingSpotlight } from "@/components/home/AICallingSpotlight";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
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
        setFeaturedProperties(data);
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

  const handleSearch = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/properties?search=${encodeURIComponent(searchQuery)}`);
      }
    },
    [searchQuery, router],
  );


  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <HeroCarousel />

      <div className="relative z-20 -mt-6 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch}>
            <div className="bg-card rounded-2xl shadow-xl px-2 flex items-center border border-border">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search properties, locations..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-lg py-3 px-4"
                aria-label="Property search"
              />
              <Button type="submit" size="lg" disabled={!searchQuery.trim()}>
                <FaSearch />
              </Button>
            </div>
          </form>
        </div>
      </div>

      <QuickActions />
      <AICallingSpotlight />

      <StatsAndPartners stats={stats} isLoading={isLoadingStats} />

      <FeaturedProperties
        properties={featuredProperties}
        propertyError={propertyError}
        isLoading={isLoadingProperties}
      />


      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <FaArrowDown className="rotate-180 w-5 h-5" />
        </button>
      )}
    </>
  );
}
