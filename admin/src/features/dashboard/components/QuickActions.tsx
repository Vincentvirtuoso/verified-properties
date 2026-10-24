"use client";

import { LuBadgeCheck, LuPackage, LuScale, LuUsers } from "react-icons/lu";

import { Button } from "@affilhomes/shared/ui";

const ACTIONS = [
  {
    label: "Review listings",
    href: "/listings?status=pending",
    icon: LuPackage,
  },
  { label: "Verify accounts", href: "/verification", icon: LuBadgeCheck },
  { label: "Open appeals", href: "/appeals", icon: LuScale },
  { label: "Browse users", href: "/accounts", icon: LuUsers },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(({ label, href, icon: Icon }) => (
        <Button key={href} size="sm" variant="outline" href={href}>
          <Icon size={14} />
          <span className="ml-1.5">{label}</span>
        </Button>
      ))}
    </div>
  );
}
