import Link from "next/link";
import {
  LuArrowRight,
  LuBadgeCheck,
  LuPackage,
  LuScale,
  LuVideo,
} from "react-icons/lu";

const ITEMS = [
  {
    label: "Verification requests",
    count: 38,
    href: "/verification",
    icon: LuBadgeCheck,
    accent: "text-info",
  },
  {
    label: "Listing moderation",
    count: 12,
    href: "/listings?status=pending",
    icon: LuPackage,
    accent: "text-warning",
  },
  {
    label: "Video reviews",
    count: 5,
    href: "/videos?status=pending",
    icon: LuVideo,
    accent: "text-primary",
  },
  {
    label: "Appeals",
    count: 7,
    href: "/appeals",
    icon: LuScale,
    accent: "text-destructive",
  },
];

export function PendingQueue() {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Needs attention</h3>
        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
          62 open
        </span>
      </div>
      <ul className="space-y-1">
        {ITEMS.map(({ label, count, href, icon: Icon, accent }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary"
            >
              <span
                className={`grid size-8 place-items-center rounded-lg bg-secondary ${accent}`}
              >
                <Icon size={16} />
              </span>
              <span className="flex-1 truncate text-sm font-medium">
                {label}
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {count}
              </span>
              <LuArrowRight size={14} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
