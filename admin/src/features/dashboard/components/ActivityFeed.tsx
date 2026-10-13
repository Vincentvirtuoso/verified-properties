import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";

import { Avatar } from "@affilhomes/shared/ui";

const ACTIVITY = [
  {
    id: 1,
    actor: "Ada O.",
    action: "approved verification for",
    target: "Kunle Realty",
    time: "4m ago",
    href: "/verification",
  },
  {
    id: 2,
    actor: "System",
    action: "auto-flagged listing",
    target: "#LST-8821",
    time: "12m ago",
    href: "/listings/LST-8821",
  },
  {
    id: 3,
    actor: "Tunde B.",
    action: "resolved appeal from",
    target: "Chidi N.",
    time: "48m ago",
    href: "/appeals",
  },
  {
    id: 4,
    actor: "Ada O.",
    action: "suspended account",
    target: "@scammer_01",
    time: "2h ago",
    href: "/accounts",
  },
  {
    id: 5,
    actor: "System",
    action: "processed payout of",
    target: "₦1,200,000",
    time: "3h ago",
    href: "/jv",
  },
];

export function ActivityFeed() {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent activity</h3>
        <Link
          href="/audit"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View audit log <LuArrowRight size={12} />
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {ACTIVITY.map((row) => (
          <li key={row.id} className="flex items-center gap-3 py-3">
            <Avatar size={20} name={row.actor} />
            <div className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{row.actor}</span>{" "}
              <span className="text-muted">{row.action}</span>{" "}
              <Link
                href={row.href}
                className="font-medium text-primary hover:underline"
              >
                {row.target}
              </Link>
            </div>
            <span className="shrink-0 text-xs text-muted">{row.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
