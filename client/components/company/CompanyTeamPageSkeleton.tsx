"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@affilhomes/shared/ui/Table";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton"; // adjust to your path
import { Breadcrumbs } from "@/components/common/BreadCrumbs";

const SKELETON_ROWS = 5;

/** Matches the shape of StatCard: label + value on the left, icon on the right. */
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-12" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

export function CompanyTeamPageSkeleton({
  rows = SKELETON_ROWS,
  showActions = true,
}: {
  rows?: number;
  /** Actions column only renders for admins on the real page; default true covers the common case. */
  showActions?: boolean;
}) {
  return (
    <div
      className="space-y-6 p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading company team…</span>

      {/* Static chrome — real content, no shift when data arrives */}
      <Breadcrumbs
        items={[
          { href: "/company/dashboard", label: "Dashboard" },
          { label: "Team" },
        ]}
      />
      <h1 className="text-2xl font-bold">Team</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Table */}
      <Table striped compact>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
            {showActions && <TableHead className="w-10">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-44" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </TableCell>
              {showActions && (
                <TableCell>
                  <Skeleton className="h-7 w-7 rounded-md" />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
