import Link from "next/link";
import {
  LuArrowRight,
  LuBadgeCheck,
  LuBookOpen,
  LuPackage,
  LuScale,
  LuUsers,
} from "react-icons/lu";

import { ActivityFeed } from "@/features/dashboard/components/ActivityFeed";
import { PendingQueue } from "@/features/dashboard/components/PendingQueue";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { TrendChart } from "@/features/dashboard/components/TrendChart";
import { StatCard } from "@/components/ui/StatCard";

export const metadata = { title: "Dashboard" };

// TODO: replace these placeholders with data from your dashboard API or a server fetch.
const stats = [
  {
    label: "Total accounts",
    value: "12,438",
    delta: "+3.2%",
    trend: "up",
    sentiment: "positive",
    icon: LuUsers,
    href: "/accounts",
  },
  {
    label: "Active listings",
    value: "4,210",
    delta: "+1.1%",
    trend: "up",
    sentiment: "positive",
    icon: LuPackage,
    href: "/listings",
  },
  {
    label: "Pending verification",
    value: "38",
    delta: "+12",
    trend: "up",
    // A growing backlog is a warning, not a win.
    sentiment: "warning",
    icon: LuBadgeCheck,
    href: "/verification",
  },
  {
    label: "Open appeals",
    value: "7",
    delta: "-2",
    trend: "down",
    // Fewer open appeals is good.
    sentiment: "positive",
    icon: LuScale,
    href: "/appeals",
  },
] as const;

const jv = {
  newRequests: 4,
  medianResponseHours: 6,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted">
            Here’s what’s happening across the platform today.
          </p>
        </div>
        <QuickActions />
      </header>

      <section
        aria-label="Key metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <TrendChart />
        </div>
        <div className="min-w-0">
          <PendingQueue />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ActivityFeed />
        </div>
        <JvReviewCard
          newRequests={jv.newRequests}
          medianResponseHours={jv.medianResponseHours}
        />
      </section>
    </div>
  );
}

function JvReviewCard({
  newRequests,
  medianResponseHours,
}: {
  newRequests: number;
  medianResponseHours: number;
}) {
  const hasPending = newRequests > 0;

  return (
    <section
      aria-labelledby="jv-review-heading"
      className="card flex min-w-0 flex-col p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LuBookOpen size={18} aria-hidden="true" className="text-primary" />
          <h2 id="jv-review-heading" className="text-sm font-semibold">
            Joint ventures
          </h2>
        </div>
        {hasPending && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {newRequests} new
          </span>
        )}
      </div>

      <p className="text-sm text-muted">
        {hasPending
          ? `${newRequests} new JV ${newRequests === 1 ? "request needs" : "requests need"} your review. Median response time is ${medianResponseHours}h.`
          : `No new JV requests. Median response time is ${medianResponseHours}h.`}
      </p>

      <Link
        href="/jv"
        className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        Review JV queue <LuArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}
