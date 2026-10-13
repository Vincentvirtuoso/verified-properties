import {
  LuArrowRight,
  LuBadgeCheck,
  LuBookOpen,
  LuPackage,
  LuScale,
  LuUsers,
} from "react-icons/lu";
import Link from "next/link";

import { ActivityFeed } from "@/features/dashboard/components/ActivityFeed";
import { PendingQueue } from "@/features/dashboard/components/PendingQueue";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { TrendChart } from "@/features/dashboard/components/TrendChart";
import { StatCard } from "@/components/ui/StatCard";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted">
            Here's what's happening across the platform today.
          </p>
        </div>
        <QuickActions />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total accounts"
          value="12,438"
          delta="+3.2%"
          trend="up"
          icon={LuUsers}
          href="/accounts"
        />
        <StatCard
          label="Active listings"
          value="4,210"
          delta="+1.1%"
          trend="up"
          icon={LuPackage}
          href="/listings"
        />
        <StatCard
          label="Pending verification"
          value="38"
          delta="+12"
          trend="up"
          icon={LuBadgeCheck}
          href="/verification"
        />
        <StatCard
          label="Open appeals"
          value="7"
          delta="-2"
          trend="down"
          icon={LuScale}
          href="/appeals"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart />
        </div>
        <PendingQueue />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <LuBookOpen size={18} className="text-primary" />
            <h3 className="text-sm font-semibold">Joint ventures</h3>
          </div>
          <p className="text-sm text-muted">
            4 new JV requests need your review. Median response time is 6h.
          </p>
          <Link
            href="/jv"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Review JV queue <LuArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
