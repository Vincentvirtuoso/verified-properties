"use client";

import { useId } from "react";
import Link from "next/link";
import { motion, useReducedMotion, Variants } from "framer-motion";
import { LuArrowRight, LuTag, LuClock, LuSearchX } from "react-icons/lu";
import Countdown from "../ui/Countdown";
import { Button } from "../ui/Button";
import { PropertyCard } from "../property/PropertyCard";
import { PopulatedProperty } from "@/types";

interface FeaturedPropertiesProps {
  isLoading: boolean;
  propertyError: string | null;
  properties: PopulatedProperty[];
}

export const FeaturedProperties = ({
  isLoading,
  properties,
  propertyError,
}: FeaturedPropertiesProps) => {
  const shouldReduceMotion = useReducedMotion();
  const headingId = useId();

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: shouldReduceMotion ? 0 : 0.07,
      },
    },
  };

  const item:Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <section
      id="featured"
      aria-labelledby={headingId}
      className="relative overflow-hidden py-20"
    >
      <div className="relative z-10 px-4 sm:px-6">
        {/* Banner ---------------------------------------------------------- */}
        <div className="relative mb-12 overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end lg:gap-8">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
              <div
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
              >
                <LuTag className="text-xl" />
              </div>
              <div className="max-w-2xl">
                <h2
                  id={headingId}
                  className="text-2xl font-bold tracking-tight md:text-3xl"
                >
                  Featured Deals
                </h2>
                <p className="mt-2 text-sm text-muted-foreground text-pretty sm:text-base">
                  Hand-picked, below-market listings across Nigeria&apos;s top
                  locations.
                </p>
              </div>
            </div>

            {/* Loss aversion: "these prices end" reads as a loss to avoid,
                not just an event to observe. */}
            <div
              role="timer"
              aria-live="polite"
              aria-label="Time remaining on featured prices"
              className="w-full lg:w-auto"
            >
              <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground lg:justify-start">
                <LuClock aria-hidden="true" className="text-sm" />
                These prices end in
              </p>
              <div className="flex justify-center lg:justify-start">
                <Countdown targetDate="2026-10-05T00:00:00" />
              </div>
            </div>
          </div>
        </div>

        {/* Content --------------------------------------------------------- */}
        {isLoading ? (
          <div
            aria-busy="true"
            aria-label="Loading featured properties"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-3xl border border-border bg-muted/40 motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : propertyError ? (
          <div
            role="alert"
            className="rounded-3xl border border-border bg-muted/20 py-20 text-center"
          >
            <p className="mb-4 font-semibold text-destructive">
              {propertyError}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          </div>
        ) : properties.length === 0 ? (
          /* Empty state: silence looks broken. Acknowledge, explain, redirect. */
          <div className="rounded-3xl border border-border bg-muted/20 py-20 text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <LuSearchX className="text-xl" />
            </div>
            <h3 className="text-lg font-semibold">
              No featured deals right now
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground text-pretty">
              New deals land every week. Check back soon, or browse everything
              currently on the market.
            </p>
            <div className="mt-6">
              <Link
                href="/properties"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Browse all properties
                <LuArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {properties.slice(0, 4).map((property) => (
                <motion.div key={property._id} variants={item}>
                  <PropertyCard {...property} />
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-16 text-center">
              <Link
                href="/properties/?type=deals"
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-semibold text-foreground transition-all duration-300 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                View all deals
                <LuArrowRight
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};