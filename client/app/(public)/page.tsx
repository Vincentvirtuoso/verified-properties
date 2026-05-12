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
import { Property, Stats, Testimonial } from "@/types";
import StatsAndPartners from "@/components/home/StatsAndPatners";
import QuickActions from "@/components/home/QuickActions";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState<string | null>(null);
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
                <FaSearch />
              </Button>
            </div>
          </form>
        </div>
      </div>

      <QuickActions />

      <StatsAndPartners stats={stats} isLoading={isLoadingStats} />

      <FeaturedProperties
        properties={featuredProperties}
        propertyError={propertyError}
        isLoading={isLoadingProperties}
      />

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
                    &quot;{t.text}&quot;
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
    </>
  );
}
