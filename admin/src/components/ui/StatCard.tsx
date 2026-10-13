import Link from "next/link";
import type { ComponentType } from "react";
import { LuArrowDownRight, LuArrowUpRight } from "react-icons/lu";

type Props = {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down";
  icon: ComponentType<{ size?: number | string; className?: string }>;
  href?: string;
};

export function StatCard({
  label,
  value,
  delta,
  trend,
  icon: Icon,
  href,
}: Props) {
  const inner = (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {value}
          </div>
        </div>
        <span className="grid size-9 place-items-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
          <Icon size={18} />
        </span>
      </div>
      {delta && (
        <div
          className={[
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            trend === "up" ? "text-success" : "text-destructive",
          ].join(" ")}
        >
          {trend === "up" ? (
            <LuArrowUpRight size={12} />
          ) : (
            <LuArrowDownRight size={12} />
          )}
          {delta}
          <span className="text-muted">vs last week</span>
        </div>
      )}
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block transition-transform hover:-translate-y-0.5"
    >
      {inner}
    </Link>
  ) : (
    inner
  );
}
