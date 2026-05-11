"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { PropertyCard } from "@/components/cards/PropertyCard";
import { Button } from "@/components/ui/Button";
import {
  FaSearch,
  FaArrowDown,
  FaStar,
  FaHome,
  FaBuilding,
  FaCity,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
  fetchFeaturedProperties,
  fetchStats,
  fetchTestimonials,
} from "@/lib/api";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Property, Stats, Testimonial } from "@/types";
import Footer from "@/components/common/Footer";

const FILTER_OPTIONS = ["All", "For Sale", "For Rent"] as const;
type FilterType = (typeof FILTER_OPTIONS)[number];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
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

    const loadTestimonials = async () => {
      try {
        const data = await fetchTestimonials();
        setTestimonials(data);
      } catch (err) {
        console.error("Failed to load testimonials", err);
      } finally {
        setIsLoadingTestimonials(false);
      }
    };

    loadFeatured();
    loadStats();
    loadTestimonials();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredProperties = useMemo(() => {
    if (!featuredProperties.length) return [];
    if (activeFilter === "All") return featuredProperties;
    const listingType = activeFilter === "For Sale" ? "sale" : "rent";
    return featuredProperties.filter((p) => p.listingType === listingType);
  }, [featuredProperties, activeFilter]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/properties?search=${encodeURIComponent(searchQuery)}`);
      }
    },
    [searchQuery, router],
  );

  const handleSubscribe = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newsletterEmail)) {
        setSubscribeStatus("error");
        return;
      }

      setIsSubscribing(true);
      setSubscribeStatus("idle");

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSubscribeStatus("success");
        setNewsletterEmail("");
        setTimeout(() => setSubscribeStatus("idle"), 3000);
      } catch {
        setSubscribeStatus("error");
      } finally {
        setIsSubscribing(false);
      }
    },
    [newsletterEmail],
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <HeroCarousel />

      <div className="relative z-20 -mt-8 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch}>
            <div className="bg-card rounded-2xl shadow-xl p-2 flex items-center border border-border">
              <FaSearch className="text-muted-foreground ml-4 mr-3 text-xl shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search properties, locations, keywords..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-lg py-3"
                aria-label="Property search"
              />
              <Button type="submit" size="lg" disabled={!searchQuery.trim()}>
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {isLoadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-muted rounded-xl h-24"
                />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-primary/10 rounded-xl p-6 flex items-center gap-4">
                <FaHome className="text-3xl text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalProperties}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Properties Listed
                  </p>
                </div>
              </div>
              <div className="bg-warning/10 rounded-xl p-6 flex items-center gap-4">
                <FaCity className="text-3xl text-warning" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.cities}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cities Covered
                  </p>
                </div>
              </div>
              <div className="bg-success/10 rounded-xl p-6 flex items-center gap-4">
                <FaBuilding className="text-3xl text-success" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.agents}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Verified Agents
                  </p>
                </div>
              </div>
              <div className="bg-info/10 rounded-xl p-6 flex items-center gap-4">
                <FaStar className="text-3xl text-info" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.happyClients}+
                  </p>
                  <p className="text-sm text-muted-foreground">Happy Clients</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section id="featured" className="py-16 bg-muted/20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Featured Properties
              </h2>
              <p className="text-muted-foreground mt-2">
                Handpicked premium listings across Nigeria
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {FILTER_OPTIONS.map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "primary" : "outline"}
                  onClick={() => setActiveFilter(filter)}
                  size="sm"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          {isLoadingProperties ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl h-100 animate-pulse border border-border"
                />
              ))}
            </div>
          ) : propertyError ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{propertyError}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : filteredProperties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property._id} {...property} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/properties">Browse All Properties</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No properties found for "{activeFilter}"
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setActiveFilter("All")}
              >
                View All Properties
              </Button>
            </div>
          )}
        </div>
      </section>

      {!isLoadingTestimonials && testimonials.length > 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-10">
              What Our Clients Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-card rounded-xl p-6 text-center border border-border"
                >
                  <div className="flex justify-center mb-4 text-warning">
                    {[...Array(t.rating)].map((_, i) => (
                      <FaStar key={i} className="w-5 h-5" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic mb-4">
                    "{t.text}"
                  </p>
                  <p className="font-semibold text-foreground">{t.author}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-card py-16 border-t border-border">
        <div className="max-w-2xl mx-auto text-center px-4 sm:px-6">
          <h3 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-primary to-warning bg-clip-text text-transparent">
            Stay Updated
          </h3>
          <p className="mt-3 text-muted-foreground">
            Subscribe to our newsletter for exclusive deals and new listings.
          </p>

          <form onSubmit={handleSubscribe} className="mt-8">
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className={`flex-1 px-6 py-4 rounded-2xl bg-background border transition-colors focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground ${
                  subscribeStatus === "error"
                    ? "border-destructive"
                    : "border-border"
                }`}
                disabled={isSubscribing}
              />
              <Button
                type="submit"
                size="lg"
                disabled={isSubscribing || !newsletterEmail}
              >
                {isSubscribing ? "Subscribing..." : "Subscribe"}
              </Button>
            </div>

            {subscribeStatus === "success" && (
              <p className="mt-3 text-sm text-success animate-fade-in">
                ✓ Successfully subscribed!
              </p>
            )}
            {subscribeStatus === "error" && (
              <p className="mt-3 text-sm text-destructive animate-fade-in">
                Please enter a valid email address.
              </p>
            )}
          </form>
        </div>
      </section>

      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <FaArrowDown className="rotate-180 w-5 h-5" />
        </button>
      )}
      <Footer />
    </>
  );
}
