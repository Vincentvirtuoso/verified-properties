"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/common/Navbar";
import { PropertyCard } from "@/components/cards/PropertyCard";
import { Button } from "@/components/ui/Button";
import { FaSearch, FaArrowDown } from "react-icons/fa";
import { featuredProperties } from "@/data/properties";

const FILTER_OPTIONS = ["All", "For Sale", "For Rent", "Short Stay"] as const;
type FilterType = (typeof FILTER_OPTIONS)[number];

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [showScrollButton, setShowScrollButton] = useState(false);

  const filteredProperties = useMemo(() => {
    if (activeFilter === "All") return featuredProperties;
    return featuredProperties.filter(
      (property) => property.type === activeFilter,
    );
  }, [activeFilter]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = useCallback(
    (e: React.SubmitEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        console.log("Searching for:", searchQuery);
        // router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    },
    [searchQuery],
  );

  const handleSubscribe = useCallback(
    async (e: React.SubmitEvent) => {
      e.preventDefault();

      if (!validateEmail(newsletterEmail)) {
        setSubscribeStatus("error");
        return;
      }

      setIsSubscribing(true);
      setSubscribeStatus("idle");

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Subscribed:", newsletterEmail);
        setSubscribeStatus("success");
        setNewsletterEmail("");

        setTimeout(() => setSubscribeStatus("idle"), 3000);
      } catch (error) {
        setSubscribeStatus("error");
      } finally {
        setIsSubscribing(false);
      }
    },
    [newsletterEmail],
  );

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <Navbar />

      <section className="relative bg-gradient-to-br from-violet-700 via-violet-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400 rounded-full blur-3xl" />
        </div>

        <div className="relative pt-24 pb-20 lg:pt-32 lg:pb-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in">
              Discover The Ideal Property
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-violet-100 max-w-2xl mx-auto">
              Unlocking Dreams, One Property at a Time
            </p>

            <form onSubmit={handleSearch} className="mt-12 max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl p-2 shadow-2xl">
                <div className="flex items-center bg-gray-50 rounded-xl px-4 sm:px-6 py-3 sm:py-4">
                  <FaSearch className="text-gray-400 mr-3 sm:mr-4 text-lg sm:text-xl flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search properties in Abuja, Lagos..."
                    className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-500 text-base sm:text-lg"
                    aria-label="Search properties"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="ml-2 sm:ml-4 flex-shrink-0"
                    disabled={!searchQuery.trim()}
                  >
                    Search
                  </Button>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Link
                  href="/advanced-search"
                  className="text-sm text-violet-200 hover:text-white flex items-center gap-2 transition-colors"
                >
                  Need More Search Options?{" "}
                  <span className="underline">Advanced Search</span>
                </Link>
              </div>
            </form>

            <div className="mt-16 flex justify-center">
              <button
                onClick={() => scrollToSection("featured")}
                className="flex flex-col items-center text-violet-200 hover:text-white transition-colors group"
                aria-label="Scroll to featured properties"
              >
                <span className="text-sm">Scroll Down To Discover</span>
                <FaArrowDown className="mt-2 animate-bounce group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="featured" className="py-16 sm:py-20 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  className="transition-all"
                  size="sm"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          {filteredProperties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {filteredProperties.map((property, index) => (
                  <PropertyCard key={property._id || index} {...property} />
                ))}
              </div>

              <div className="text-center mt-12">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/properties">Browse All Hot Offers</Link>
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

      <section className="bg-white py-16 sm:py-20 border-t">
        <div className="max-w-2xl mx-auto text-center px-4 sm:px-6">
          <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
            Stay Updated
          </h3>
          <p className="mt-3 text-gray-600">
            Subscribe to our newsletter to receive the latest news and updates.
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
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-violet-600"
                }`}
                aria-label="Email for newsletter"
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
                ✓ Successfully subscribed! Check your email for confirmation.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            <div>
              <h2 className="text-white text-2xl font-bold mb-4">
                Verified<span className="text-orange-500">Properties</span>
              </h2>
              <p className="text-sm leading-relaxed">
                Nigeria's most trusted real estate marketplace.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">
                Popular Searches
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-white transition-colors cursor-pointer">
                  House For Rent in Abuja
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Houses for rent in Lagos
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Apartment for rent in Lagos
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Helpful Links</h4>
              <ul className="space-y-2 text-sm">
                {[
                  "About",
                  "Help Center",
                  "Contact",
                  "Privacy Policy",
                  "Refund Policy",
                ].map((link) => (
                  <li key={link}>
                    <Link
                      href={`/${link.toLowerCase().replace(/\s+/g, "-")}`}
                      className="hover:text-white transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact Info</h4>
              <address className="not-italic text-sm space-y-2">
                <p>Email: info@verifiedproperties.ng</p>
                <p>8a, Dar-Es-Salam, Wuse 2, Abuja, Nigeria</p>
              </address>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>
              © VERIFIED PROPERTIES {new Date().getFullYear()}. All Rights
              Reserved.
            </p>
          </div>
        </div>
      </footer>

      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-violet-500 z-50"
          aria-label="Scroll to top"
        >
          <FaArrowDown className="rotate-180 w-5 h-5" />
        </button>
      )}
    </>
  );
}
