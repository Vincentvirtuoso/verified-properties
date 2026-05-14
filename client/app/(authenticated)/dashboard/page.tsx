// app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import {
  LuHeart,
  LuHistory,
  LuCirclePlus,
  LuUsers,
  LuBriefcase,
  LuArrowUpRight,
} from "react-icons/lu";
import { FiBarChart2 } from "react-icons/fi";

const dummyStats = {
  buyer: { savedSearches: 4, recentViews: 12, savedProperties: 7 },
  agent: {
    activeListings: 2,
    freeLimit: 3,
    leadsThisMonth: 8,
    viewsThisMonth: 143,
  },
  landlord: { properties: 5, occupied: 3, totalRevenue: "₦2,450,000" },
  developer: { ongoingProjects: 3, unitsSold: 28, upcomingLaunches: 1 },
  company: { totalListings: 47, teamMembers: 9, activeLeads: 112 },
};

const BuyerDashboard = () => (
  <div className="space-y-8">
    <h2 className="text-2xl font-bold">Welcome back!</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard
        icon={<LuHeart />}
        label="Saved Homes"
        value={dummyStats.buyer.savedProperties}
        href="/favorites"
      />
      <DashboardCard
        icon={<LuHistory />}
        label="Recent Views"
        value={dummyStats.buyer.recentViews}
        href="/history"
      />
      <DashboardCard
        icon={<LuCirclePlus />}
        label="Saved Searches"
        value={dummyStats.buyer.savedSearches}
        href="/saved-searches"
      />
    </div>
    <RecentListings
      title="Recommended For You"
      listings={dummyRecentProperties}
    />
  </div>
);

const AgentDashboard = () => {
  const { user } = useAuth();
  const freeListingsUsed = user?.agentProfile?.freeListingsUsed ?? 0;
  const maxFreeListings = user?.agentProfile?.maxFreeListings ?? 3;
  const remaining = Math.max(maxFreeListings - freeListingsUsed, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Agent Dashboard</h2>
        <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
          Free listings: {freeListingsUsed}/{maxFreeListings} used
        </span>
      </div>
      {remaining === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl">
          You’ve used all your free listings.{" "}
          <a href="/upgrade" className="font-semibold underline">
            Upgrade to Partnership
          </a>{" "}
          for unlimited listings and more features.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          icon={<LuCirclePlus />}
          label="Active Listings"
          value={dummyStats.agent.activeListings}
          href="/my-listings"
        />
        <DashboardCard
          icon={<LuUsers />}
          label="Leads This Month"
          value={dummyStats.agent.leadsThisMonth}
        />
        <DashboardCard
          icon={<FiBarChart2 />}
          label="Profile Views"
          value={dummyStats.agent.viewsThisMonth}
        />
      </div>
      <RecentListings title="Your Listings" listings={dummyAgentListings} />
    </div>
  );
};

const LandlordDashboard = () => (
  <div className="space-y-8">
    <h2 className="text-2xl font-bold">Landlord Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard
        icon={<LuCirclePlus />}
        label="My Properties"
        value={dummyStats.landlord.properties}
        href="/my-listings"
      />
      <DashboardCard
        icon={<FiBarChart2 />}
        label="Occupied"
        value={`${dummyStats.landlord.occupied}/${dummyStats.landlord.properties}`}
      />
      <DashboardCard
        icon={<LuArrowUpRight />}
        label="Monthly Revenue"
        value={dummyStats.landlord.totalRevenue}
      />
    </div>
    <RecentListings
      title="Your Properties"
      listings={dummyLandlordProperties}
    />
  </div>
);

const DeveloperDashboard = () => (
  <div className="space-y-8">
    <h2 className="text-2xl font-bold">Developer Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard
        icon={<LuBriefcase />}
        label="Ongoing Projects"
        value={dummyStats.developer.ongoingProjects}
      />
      <DashboardCard
        icon={<FiBarChart2 />}
        label="Units Sold"
        value={dummyStats.developer.unitsSold}
      />
      <DashboardCard
        icon={<LuCirclePlus />}
        label="Upcoming Launches"
        value={dummyStats.developer.upcomingLaunches}
        href="/company/listings"
      />
    </div>
    <RecentListings title="Recent Projects" listings={dummyDeveloperListings} />
  </div>
);

const CompanyDashboard = () => (
  <div className="space-y-8">
    <h2 className="text-2xl font-bold">Company Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard
        icon={<LuCirclePlus />}
        label="Total Listings"
        value={dummyStats.company.totalListings}
        href="/company/listings"
      />
      <DashboardCard
        icon={<LuUsers />}
        label="Team Members"
        value={dummyStats.company.teamMembers}
        href="/company/team"
      />
      <DashboardCard
        icon={<FiBarChart2 />}
        label="Active Leads"
        value={dummyStats.company.activeLeads}
      />
    </div>
    <RecentListings title="Company Listings" listings={dummyCompanyListings} />
  </div>
);

// Reusable card & listing row
function DashboardCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  href?: string;
}) {
  const Content = (
    <div className="bg-white dark:bg-sidebar-bg border border-border rounded-2xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="p-3 bg-primary/10 rounded-xl text-primary text-2xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {Content}
      </a>
    );
  }
  return Content;
}

// Dummy property objects – replace with real API calls
const dummyRecentProperties = [
  {
    _id: "1",
    title: "4 Bedroom Duplex in Lekki",
    price: 85000000,
    image: "/placeholder.jpg",
  },
  {
    _id: "2",
    title: "3 Bedroom Apartment Ikoyi",
    price: 45000000,
    image: "/placeholder.jpg",
  },
];
const dummyAgentListings = [
  {
    _id: "3",
    title: "Luxury Terrace in GRA",
    price: 65000000,
    status: "active",
  },
];
const dummyLandlordProperties = [
  {
    _id: "4",
    title: "Commercial Space in VI",
    price: 120000000,
    status: "rented",
  },
];
const dummyDeveloperListings = [
  {
    _id: "5",
    title: "Skyline Towers Phase 2",
    price: 35000000,
    status: "selling",
  },
];
const dummyCompanyListings = [
  {
    _id: "6",
    title: "Oasis Gardens Estate",
    price: 25000000,
    status: "active",
  },
];

function RecentListings({
  title,
  listings,
}: {
  title: string;
  listings: { _id: string; title: string; price: number }[];
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {listings.length === 0 && (
        <p className="text-muted-foreground">No listings yet.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listings.map((item) => (
          <div
            key={item._id}
            className="flex items-center gap-4 bg-white dark:bg-sidebar-bg border border-border rounded-xl p-4 hover:shadow-sm"
          >
            <div className="w-16 h-16 bg-muted rounded-lg shrink-0" />
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                ₦{item.price?.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Dashboard Page
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  const roleComponent = {
    [Role.Buyer]: <BuyerDashboard />,
    [Role.Agent]: <AgentDashboard />,
    [Role.Landlord]: <LandlordDashboard />,
    [Role.Developer]: <DeveloperDashboard />,
    [Role.Company]: <CompanyDashboard />,
  }[user.activeRole] ?? <BuyerDashboard />; // fallback

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Hello, {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user.activeRole.charAt(0).toUpperCase() + user.activeRole.slice(1)}{" "}
          dashboard
        </p>
      </div>
      {roleComponent}
    </div>
  );
}
