"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Role, PopulatedUser, PopulatedProperty } from "@/types";
import { mockCompanies } from "@/data/companies";
import { dummyUsers } from "@/data/users";
import { properties } from "@/data/properties";
import {
  LuHeart,
  LuHistory,
  LuCirclePlus,
  LuUsers,
  LuBriefcase,
  LuArrowUpRight,
} from "react-icons/lu";
import { FiBarChart2 } from "react-icons/fi";

// ==========================================
// Sub-Dashboards per User Role
// ==========================================

const ViewerDashboard = ({ user }: { user: PopulatedUser }) => {
  // Pull default recommendations from shared properties list
  const recommended = properties.slice(0, 2);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Welcome back!</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          icon={<LuHeart />}
          label="Saved Homes"
          value={user.viewerProfile?.savedListingIds?.length ?? 0}
          href="/favorites"
        />
        <DashboardCard
          icon={<LuHistory />}
          label="Preferred Locations"
          value={user.viewerProfile?.preferredLocations?.length ?? 0}
        />
        <DashboardCard
          icon={<LuCirclePlus />}
          label="Budget Range Status"
          value={
            user.viewerProfile?.budgetRange
              ? `${user.viewerProfile.budgetRange.currency} ${user.viewerProfile.budgetRange.max?.toLocaleString()}`
              : "Flexible"
          }
        />
      </div>
      <RecentListings title="Recommended For You" listings={recommended} />
    </div>
  );
};

const AgentDashboard = ({ user }: { user: PopulatedUser }) => {
  // Filter global properties assigned to this specific agent
  const agentListings = properties.filter(
    (p) =>
      p.ownerType === "agent" &&
      (typeof p.ownerId === "string" ? p.ownerId === user._id : p.ownerId._id === user._id)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Agent Dashboard</h2>
        <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full capitalize">
          Status: {user.agentProfile?.verificationStatus ?? "Unverified"}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          icon={<LuCirclePlus />}
          label="Active Listings"
          value={user.agentProfile?.activeListings ?? agentListings.length}
          href="/my-listings"
        />
        <DashboardCard
          icon={<FiBarChart2 />}
          label="Boosted Listings"
          value={user.agentProfile?.activeBoostedListings ?? 0}
        />
        <DashboardCard
          icon={<LuUsers />}
          label="Brokerage Network"
          value={user.agentProfile?.brokerage ?? "Independent"}
        />
      </div>
      <RecentListings title="Your Listings" listings={agentListings} />
    </div>
  );
};

const LandlordDashboard = ({ user }: { user: PopulatedUser }) => {
  const landlordListings = properties.filter(
    (p) =>
      p.ownerType === "landlord" &&
      (typeof p.ownerId === "string" ? p.ownerId === user._id : p.ownerId._id === user._id)
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Landlord Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          icon={<LuCirclePlus />}
          label="My Properties"
          value={user.landlordProfile?.activeListings ?? landlordListings.length}
          href="/my-listings"
        />
        <DashboardCard
          icon={<FiBarChart2 />}
          label="Verification Profile"
          value={user.landlordProfile?.verificationStatus ?? "Unverified"}
          className="capitalize"
        />
        <DashboardCard
          icon={<LuArrowUpRight />}
          label="Total Remitted Revenue"
          value={`₦${(user.landlordProfile?.totalRemitted ?? 0).toLocaleString()}`}
        />
      </div>
      <RecentListings title="Your Properties" listings={landlordListings} />
    </div>
  );
};

const DeveloperDashboard = ({ user }: { user: PopulatedUser }) => {
  const companyData = user.companyId; 
  const developerListings = properties.filter(
    (p) =>
      p.ownerType === "company" &&
      (typeof p.ownerId === "string" ? p.ownerId === user._id : p.ownerId._id === user._id)
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Developer Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          icon={<LuBriefcase />}
          label="Active Projects"
          value={companyData && typeof companyData !== "string" ? companyData.activeListings : developerListings.length}
        />
        <DashboardCard
          icon={<LuUsers />}
          label="Team Infrastructure"
          value={companyData && typeof companyData !== "string" ? companyData.team?.length ?? 0 : 0}
          href="/company/team"
        />
        <DashboardCard
          icon={<LuCirclePlus />}
          label="Project Verification"
          value={companyData && typeof companyData !== "string" ? companyData.verificationStatus : "Unverified"}
          className="capitalize"
        />
      </div>
      <RecentListings title="Recent Managed Projects" listings={developerListings} />
    </div>
  );
};

const CompanyDashboard = ({ user }: { user: PopulatedUser }) => {
  const companyData = user.companyId;
  const companyListings = properties.filter(
    (p) =>
      p.ownerType === "company" &&
      (typeof p.ownerId === "string" ? p.ownerId === user._id : p.ownerId._id === user._id)
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Company Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          icon={<LuCirclePlus />}
          label="Total Enterprise Listings"
          value={companyData && typeof companyData !== "string" ? companyData.activeListings : companyListings.length}
          href="/company/listings"
        />
        <DashboardCard
          icon={<LuUsers />}
          label="Active Members"
          value={companyData && typeof companyData !== "string" ? companyData.team?.length ?? 0 : 0}
          href="/company/team"
        />
        <DashboardCard
          icon={<FiBarChart2 />}
          label="Total Remitted Asset Value"
          value={`₦${(companyData && typeof companyData !== "string" ? companyData.totalRemitted : 0).toLocaleString()}`}
        />
      </div>
      <RecentListings title="Company Portfolios" listings={companyListings} />
    </div>
  );
};

// ==========================================
// Reusable Structural Components
// ==========================================

function DashboardCard({
  icon,
  label,
  value,
  href,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  href?: string;
  className?: string;
}) {
  const Content = (
    <div className="bg-white dark:bg-sidebar-bg border border-border rounded-2xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="p-3 bg-primary/10 rounded-xl text-primary text-2xl shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${className || ""}`}>{value}</p>
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

function RecentListings({
  title,
  listings,
}: {
  title: string;
  listings: PopulatedProperty[];
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {listings.length === 0 && (
        <p className="text-muted-foreground">No property listings found to display.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listings.map((item) => (
          <div
            key={item._id}
            className="flex items-center gap-4 bg-white dark:bg-sidebar-bg border border-border rounded-xl p-4 hover:shadow-sm"
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-16 h-16 bg-muted rounded-lg shrink-0 object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg shrink-0" />
            )}
            <div>
              <p className="font-medium line-clamp-1">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.currency || "₦"}{item.price?.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// Core Dashboard Orchestrator Route
// ==========================================

export default function DashboardPage() {
  const router = useRouter();
  const authContext = useAuth();
  
  // Explicit Type-casting to map incoming state safely directly to PopulatedUser architecture
  const user = authContext.user as PopulatedUser | null;
  const isAuthenticated = authContext.isAuthenticated;
  const isLoading = authContext.isLoading;

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

  // Dynamic dashboard selection strategy mapping cleanly across active types
  const roleComponent = {
    [Role.Viewer]: <ViewerDashboard user={user} />,
    [Role.Agent]: <AgentDashboard user={user} />,
    [Role.Landlord]: <LandlordDashboard user={user} />,
    [Role.Developer]: <DeveloperDashboard user={user} />,
    [Role.Company]: <CompanyDashboard user={user} />,
  }[user.activeRole] ?? <ViewerDashboard user={user} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Hello, {user.name ? user.name.split(" ")[0] : "User"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user.activeRole.charAt(0).toUpperCase() + user.activeRole.slice(1)} space view
        </p>
      </div>
      {roleComponent}
    </div>
  );
}
