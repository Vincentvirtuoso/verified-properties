import { FaHome, FaCity, FaBuilding, FaStar } from "react-icons/fa";
import { DashboardStats } from "@/types";
import Image from "next/image";
import { StatCard, StatItem } from "../cards/StatCard";

interface Partner {
  name: string;
  logo: string;
}

const PARTNERS: Partner[] = [
  { name: "CityBird", logo: "/logos/city-bird.jpg" },
  { name: "Dantata", logo: "/logos/dantata-real-estate.jpg" },
  { name: "Airbnb", logo: "/logos/mshel-homes.jpg" },
];

const StatsAndPartners = ({
  stats,
  isLoading,
}: {
  stats: DashboardStats | null;
  isLoading: boolean;
}) => {
  const statConfig: StatItem[] = [
    {
      id: "props",
      label: "Properties Listed",
      value: stats?.totalProperties ?? 0,
      icon: FaHome,
      colorClass: "bg-blue-500/10 text-blue-600",
    },
    {
      id: "cities",
      label: "Cities Covered",
      value: stats?.cities ?? 0,
      icon: FaCity,
      colorClass: "bg-orange-500/10 text-orange-600",
    },
    {
      id: "agents",
      label: "Verified Agents",
      value: stats?.owners ?? 0,
      icon: FaBuilding,
      colorClass: "bg-green-500/10 text-green-600",
    },
    {
      id: "clients",
      label: "Happy Clients",
      value: `${stats?.happyClients ?? 0}+`,
      icon: FaStar,
      colorClass: "bg-purple-500/10 text-purple-600",
    },
  ];

  return (
    <section className="pt-20 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {isLoading
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-28 w-full animate-pulse bg-muted rounded-2xl"
                  />
                ))
            : statConfig.map((stat, index) => (
                <StatCard key={stat.id} stat={stat} index={index} />
              ))}
        </div>

        <div className="pt-10 border-t border-border/60">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
            Trusted by Industry Leaders
          </p>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 hover:opacity-100 transition-all duration-500">
            {PARTNERS.map((partner) => (
              <div
                key={partner.name}
                className="relative h-8 md:h-10 w-auto min-w-20"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={120}
                  height={40}
                  className="object-contain w-auto h-full"
                  priority={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsAndPartners;
