"use client";

import { Fragment, useEffect, useState } from "react";
import { fetchMyListings } from "@affilhomes/shared/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Role,
  PopulatedUser,
  PopulatedProperty,
} from "@affilhomes/shared/types";
import { properties } from "@/data/properties";
import {
  LuHeart,
  LuHistory,
  LuCirclePlus,
  LuUsers,
  LuBriefcase,
  LuArrowUpRight,
  LuRocket,
  LuMessageSquare,
  LuFileText,
  LuPhone,
} from "react-icons/lu";
import { FiZap } from "react-icons/fi";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Button } from "@affilhomes/shared/ui/Button";
import Link from "next/link";
import UserHeaderCard from "@/components/common/UserHeaderCard";
import {
  BsBarChartSteps,
  BsBuildingAdd,
  BsBuildingFillGear,
} from "react-icons/bs";
import { cn } from "@/lib/utils";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { useSavedProperties } from "@/contexts/SavedPropertiesContext";
import { LuMapPin, LuImage } from "react-icons/lu";
import { PropertyStatus } from "@affilhomes/shared/types";

const LISTING_STATUS: Record<
  PropertyStatus,
  { label: string; className: string }
> = {
  active: { label: "Live", className: "bg-emerald-500/10 text-emerald-600" },
  draft: {
    label: "Pending review",
    className: "bg-amber-500/10 text-amber-600",
  },
  sold: { label: "Sold", className: "bg-blue-500/10 text-blue-600" },
  rented: { label: "Rented", className: "bg-blue-500/10 text-blue-600" },
  inactive: {
    label: "Inactive",
    className: "bg-muted/30 text-muted-foreground",
  },
};

function ListingStatusRow({ item }: { item: PopulatedProperty }) {
  const status = LISTING_STATUS[item.status];
  const image = item.image ?? item.gallery?.[0]?.url;
  const place = [item.location.city, item.location.state]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/properties/${item.slug}`}
      className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all"
    >
      {image ? (
        <img
          src={image}
          alt=""
          className="h-16 w-20 rounded-xl object-cover shrink-0 bg-muted"
        />
      ) : (
        <div className="h-16 w-20 rounded-xl bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
          <LuImage />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{item.title}</p>
        <p className="text-sm text-muted truncate flex items-center gap-1">
          <LuMapPin className="shrink-0" />
          {place}
        </p>
      </div>
      <span
        className={cn(
          "text-xs font-medium px-2.5 py-1 rounded-full shrink-0",
          status.className,
        )}
      >
        {status.label}
      </span>
    </Link>
  );
}

const ViewerDashboard = ({ user }: { user: PopulatedUser }) => {
  const recommended = properties.slice(0, 2);
  const { savedCount } = useSavedProperties();

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">
        Welcome back, {user.name.split(" ")[0]}!
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          icon={<LuHeart />}
          label="Saved Homes"
          value={savedCount}
          href="/saved-properties"
        />
        <DashboardCard
          icon={<LuHistory />}
          label="Preferred Locations"
          value={user.viewerProfile?.preferredLocations?.length ?? 0}
        />
        <DashboardCard
          icon={<LuCirclePlus />}
          label="Budget Range"
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

const AgentDashboard = ({
  user,
  setProfileOpen,
}: {
  user: PopulatedUser;
  setProfileOpen: (isOpen: boolean) => void;
}) => {
  const agentProfile = user.agentProfile;
  const subRole = agentProfile?.subRole;

  const [agentListings, setAgentListings] = useState<PopulatedProperty[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchMyListings(user)
      .then((rows) => {
        if (!cancelled)
          setAgentListings(rows.filter((p) => p.ownerType === "agent"));
      })
      .catch((error) => console.error("Failed to load listings:", error));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const quickActions = [
    {
      label: "List a Property",
      icon: BsBuildingAdd,
      href: "/list-property",
      color: "primary",
    },
    {
      label: "Boost a Listing",
      icon: LuRocket,
      href: "/dashboard/boost",
      color: "amber",
    },
    {
      label: "View Inquiries",
      icon: LuMessageSquare,
      href: "/dashboard/inquiries",
      color: "blue",
    },
    {
      label: "Analytics",
      icon: BsBarChartSteps,
      href: "/dashboard/analytics",
      color: "emerald",
    },
  ];

  // Role-specific actions
  if (subRole === "realtor") {
    quickActions.push({
      label: "Manage Brokerage",
      icon: BsBuildingFillGear,
      href: "/dashboard/brokerage",
      color: "purple",
    });
  }

  if (subRole === "lawyer") {
    quickActions.push({
      label: "Document Templates",
      icon: LuFileText,
      href: "/dashboard/documents",
      color: "purple",
    });
  }

  if (subRole === "surveyor") {
    quickActions.push({
      label: "Survey Reports",
      icon: LuFileText,
      href: "/dashboard/surveys",
      color: "purple",
    });
  }

  if (subRole === "landlord") {
    quickActions.push({
      label: "Tenant Applications",
      icon: LuUsers,
      href: "/dashboard/tenants",
      color: "purple",
    });
  }

  quickActions.push({
    label: "Contact Support",
    icon: LuPhone,
    href: "/support",
    color: "gray",
  });

  return (
    <div className="space-y-8">
      <UserHeaderCard user={user} onProfileOpen={() => setProfileOpen(true)} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          icon={<LuCirclePlus />}
          label="Active Listings"
          value={agentProfile?.activeListings ?? agentListings.length}
          href="/my-listings"
        />
        <DashboardCard
          icon={<FiZap />}
          label="Boosted Listings"
          value={agentProfile?.activeBoostedListings ?? 0}
        />

        {subRole === "realtor" && (
          <DashboardCard
            icon={<LuUsers />}
            label="Brokerage"
            value={agentProfile?.brokerage ?? "Independent"}
          />
        )}

        {subRole === "landlord" && (
          <DashboardCard
            icon={<LuArrowUpRight />}
            label="Properties Owned"
            value={agentProfile?.activeListings ?? 0}
          />
        )}

        {(subRole === "lawyer" || subRole === "surveyor") && (
          <DashboardCard
            icon={<LuBriefcase />}
            label="Professional ID"
            value={agentProfile?.licenseNumber ?? "N/A"}
          />
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LuRocket className="text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              fullWidth
              href={action.href}
              className={cn(
                "gap-2 justify-start",
                action.color === "primary" &&
                  "hover:border-primary/50 hover:bg-primary/5",
                action.color === "amber" &&
                  "hover:border-amber-500/50 hover:bg-amber-500/5",
                action.color === "blue" &&
                  "hover:border-blue-500/50 hover:bg-blue-500/5",
                action.color === "emerald" &&
                  "hover:border-emerald-500/50 hover:bg-emerald-500/5",
                action.color === "purple" &&
                  "hover:border-purple-500/50 hover:bg-purple-500/5",
                action.color === "gray" && "hover:border-muted-foreground/30",
              )}
              leftIcon={<action.icon className="h-4 w-4" />}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <RecentListings
        title="Your Recent Listings"
        listings={agentListings}
        renderItem={(item) => <ListingStatusRow item={item} />}
      />
    </div>
  );
};

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
    <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4 hover:shadow-md transition-all h-full">
      <div className="p-3 bg-primary/10 rounded-xl text-primary text-2xl shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted truncate">{label}</p>
        <p className={`text-2xl font-bold truncate ${className || ""}`}>
          {value}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {Content}
    </Link>
  ) : (
    Content
  );
}

function RecentListings({
  title,
  listings,
  renderItem,
}: {
  title: string;
  listings: PopulatedProperty[];
  renderItem?: (item: PopulatedProperty) => React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {listings.length === 0 ? (
        <div className="bg-muted/50 border border-border rounded-2xl p-8 text-center">
          <p className="text-muted">No listings found yet.</p>
        </div>
      ) : (
        <>
          {renderItem ? (
            <div className="space-y-3">
              {listings.slice(0, 3).map((item) => (
                <Fragment key={item._id}>{renderItem(item)}</Fragment>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.slice(0, 3).map((item) => (
                <PropertyCard key={item._id} {...item} />
              ))}
            </div>
          )}
          <div className="flex justify-center mt-6">
            <Link href="/my-listings">
              <Button variant="outline" className="px-8">
                View All Listings
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.activeRole) {
      case Role.Viewer:
        return <ViewerDashboard user={user} />;
      case Role.Agent:
        return <AgentDashboard user={user} setProfileOpen={setProfileOpen} />;
      case Role.Company:
        return null;
      default:
        return <ViewerDashboard user={user} />;
    }
  };

  if (user.activeRole === Role.Company) {
    return router.replace("/company/dashboard");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderDashboard()}

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted/30 shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-5 w-40 rounded bg-muted/30" />
          <div className="h-4 w-56 rounded bg-muted/30" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-muted/30" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-xl bg-muted/30 shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 w-24 rounded bg-muted/30" />
              <div className="h-6 w-20 rounded bg-muted/30" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="h-5 w-32 rounded bg-muted/30" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-muted/30" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-5 w-48 rounded bg-muted/30" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="aspect-4/3 bg-muted/30" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 rounded bg-muted/30" />
                <div className="h-4 w-1/2 rounded bg-muted/30" />
                <div className="h-4 w-2/3 rounded bg-muted/30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
