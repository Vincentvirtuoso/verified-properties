"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/common/Navbar";
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

const FILTER_OPTIONS = ["All", "For Sale", "For Rent"] as const;
type FilterType = (typeof FILTER_OPTIONS)[number];

export default function HomePage() {
  const router = useRouter();

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Featured properties
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  // Stats
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);

  // Newsletter
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // UI helpers
  const [showScrollButton, setShowScrollButton] = useState(false);

  // ---------- Mock data fetching ----------
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

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Client‑side filtering of already fetched featured properties
  const filteredProperties = useMemo(() => {
    if (!featuredProperties.length) return [];
    if (activeFilter === "All") return featuredProperties;
    const listingType = activeFilter === "For Sale" ? "sale" : "rent";
    return featuredProperties.filter((p) => p.listingType === listingType);
  }, [featuredProperties, activeFilter]);

  // Handlers
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
        // Mock subscription API – replace with real call later
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
      <Navbar />

      <HeroCarousel />

      <div className="relative z-20 -mt-16 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch}>
            <div className="bg-white rounded-2xl shadow-2xl p-2 flex items-center">
              <FaSearch className="text-gray-400 ml-4 mr-3 text-xl shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search properties, locations, keywords..."
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-500 text-lg py-3"
                aria-label="Property search"
              />
              <Button type="submit" size="lg" disabled={!searchQuery.trim()}>
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {isLoadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-100 rounded-xl h-24"
                />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-violet-50 rounded-xl p-6 flex items-center gap-4">
                <FaHome className="text-3xl text-violet-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalProperties}
                  </p>
                  <p className="text-sm text-gray-600">Properties Listed</p>
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl p-6 flex items-center gap-4">
                <FaCity className="text-3xl text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.cities}
                  </p>
                  <p className="text-sm text-gray-600">Cities Covered</p>
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-6 flex items-center gap-4">
                <FaBuilding className="text-3xl text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.agents}
                  </p>
                  <p className="text-sm text-gray-600">Verified Agents</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 flex items-center gap-4">
                <FaStar className="text-3xl text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.happyClients}+
                  </p>
                  <p className="text-sm text-gray-600">Happy Clients</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section id="featured" className="py-16 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Featured Properties
              </h2>
              <p className="text-gray-600 mt-2">
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
                  className="bg-white rounded-2xl h-100 animate-pulse"
                />
              ))}
            </div>
          ) : propertyError ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{propertyError}</p>
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
              <p className="text-gray-500 text-lg">
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
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-10">
              What Our Clients Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-gray-50 rounded-xl p-6 text-center"
                >
                  <div className="flex justify-center mb-4 text-yellow-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <FaStar key={i} className="w-5 h-5" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic mb-4">"{t.text}"</p>
                  <p className="font-semibold text-gray-900">{t.author}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-16 border-t border-gray-200">
        <div className="max-w-2xl mx-auto text-center px-4 sm:px-6">
          <h3 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
            Stay Updated
          </h3>
          <p className="mt-3 text-gray-600">
            Subscribe to our newsletter for exclusive deals and new listings.
          </p>

          <form onSubmit={handleSubscribe} className="mt-8">
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className={`flex-1 px-6 py-4 rounded-2xl border transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  subscribeStatus === "error"
                    ? "border-red-500"
                    : "border-gray-300"
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
              <p className="mt-3 text-sm text-green-600 animate-fade-in">
                ✓ Successfully subscribed!
              </p>
            )}
            {subscribeStatus === "error" && (
              <p className="mt-3 text-sm text-red-600 animate-fade-in">
                Please enter a valid email address.
              </p>
            )}
          </form>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h2 className="text-white text-2xl font-bold mb-4">
                Verified<span className="text-orange-500">Properties</span>
              </h2>
              <p className="text-sm">
                Nigeria's most trusted real estate platform.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/properties" className="hover:text-white">
                    All Properties
                  </Link>
                </li>
                <li>
                  <Link
                    href="/properties?type=For+Sale"
                    className="hover:text-white"
                  >
                    For Sale
                  </Link>
                </li>
                <li>
                  <Link
                    href="/properties?type=For+Rent"
                    className="hover:text-white"
                  >
                    For Rent
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <address className="not-italic text-sm space-y-2">
                <p>info@verifiedproperties.ng</p>
                <p>8a, Dar‑Es‑Salam, Wuse 2, Abuja</p>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm">
            <p>
              © {new Date().getFullYear()} Verified Properties. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <FaArrowDown className="rotate-180 w-5 h-5" />
        </button>
      )}
    </>
  );
}
