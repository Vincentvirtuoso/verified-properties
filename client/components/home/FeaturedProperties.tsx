import { motion } from "framer-motion";
import { LuArrowRight, LuTag } from "react-icons/lu";
import Countdown from "../ui/Countdown";
import { Button } from "../ui/Button";
import { PropertyCard } from "../cards/PropertyCard";
import { Property } from "@/types";
import Link from "next/link";

interface FeaturedPropertiesProps {
  isLoading: boolean;
  propertyError: string | null;
  properties: Property[];
}

export const FeaturedProperties = ({
  isLoading,
  properties,
  propertyError,
}: FeaturedPropertiesProps) => {
  return (
    <section id="featured" className="relative py-20 overflow-hidden">
      <div className="px-4 sm:px-6 relative z-10">
        <div className="relative mb-12 overflow-hidden rounded-2xl border border-primary/30 bg-red-700 p-6 shadow-2xl">
          <div className="shimmer-effect animate-shimmer pointer-events-none" />

          <div className="flex flex-col lg:flex-row justify-between items-end gap-8 relative z-10">
            <div className="flex sm:flex-row flex-col items-center gap-6">
              <LuTag className="shrink-0 text-4xl text-white" />
              <div className="text-center lg:text-left max-w-2xl">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-[0.9] tracking-tighter">
                  EXCLUSIVE DEALS
                </h2>
                <p className="text-white/80 mt-4 text-md font-medium">
                  Below-market rates on Nigeria&apos;s most prestigious
                  properties. Once the clock hits zero, these prices vanish.
                </p>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-3 text-center lg:text-left">
                Offer Ends In:
              </p>
              <Countdown targetDate="2026-06-01T00:00:00" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-3xl h-100 animate-pulse border border-white/10"
              />
            ))}
          </div>
        ) : propertyError ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-primary font-bold mb-4">{propertyError}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
            >
              {properties.slice(0, 4).map((property) => (
                <PropertyCard key={property._id} {...property} />
              ))}
            </motion.div>

            <div className="text-center mt-16">
              <Link
                href="/properties/?type=deals"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-black rounded-full hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-white/10"
              >
                VIEW ALL DEALS
                <LuArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
