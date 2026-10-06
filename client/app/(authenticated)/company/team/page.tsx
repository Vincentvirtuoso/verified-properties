"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableAction,
} from "@/components/ui/Table";
import {
  LuUsers as Users,
  LuShieldCheck as ShieldCheck,
  LuActivity as Activity,
  LuUserCog,
  LuBuilding2,
  LuPencil,
  LuShield,
  LuBan,
  LuTrash2,
  LuPlus,
} from "react-icons/lu";
import { useAuth } from "@/contexts/AuthContext";
// import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui";
import { TagOverflow } from "@/components/ui/TagOverflow";
import { DropdownItem, DropdownSeparator } from "@/components/ui/Dropdown";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { PageSpinner } from "@/components/ui/Spinner";

export default function CompanyTeamPage() {
  const { user, companies, isLoading } = useAuth();
  // const [imageError, setImageError] = useState(false);
  const companyId =
    typeof user?.companyId === "string" ? user.companyId : user?.companyId?._id;

  const company = companies.find((c) => c._id === companyId);

  if (isLoading) {
    return <PageSpinner label="Loading company team" />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted">Please log in to view your company.</p>
      </div>
    );
  }

  if (!company) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"
      >
        <LuBuilding2 className="w-16 h-16 text-muted/40" />
        <h2 className="text-xl font-semibold">No Company Found</h2>
        <p className="text-muted text-center max-w-md">
          You are not associated with any company. Create one to get started.
        </p>
        <Button>Create Company</Button>
      </motion.div>
    );
  }

  const team = company.team;

  const admins = team.filter((m) => m.role === "admin").length;
  const currentUserId = user._id;
  const totalMembers = team.length;
  const isAdmin = user.companyRole === "admin";

  return (
    <div className="space-y-6 p-6">
      <Breadcrumbs
        items={[
          { href: "/company/dashboard", label: "Dashboard" },
          { label: "Team" },
        ]}
      />
      <h1 className="text-2xl font-bold">Team</h1>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Members"
          value={totalMembers}
          icon={Users}
          accent="primary"
        />
        <StatCard
          label="Admin(s)"
          value={admins}
          icon={ShieldCheck}
          accent="info"
        />
        <StatCard
          label="Listings Managed"
          value={company.activeListings}
          icon={Activity}
          accent="emerald"
        />
        <StatCard
          label="Permissions"
          value={`${new Set(team.flatMap((m) => m.permissions)).size} unique`}
          icon={LuUserCog}
          accent="violet"
          action={{
            onAction: () => console.log("action"),
            label: "Add more",
            icon: <LuPlus />,
          }}
        />
      </div>

      {/* Team table */}
      <Table striped compact>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
            {isAdmin && <TableHead className="w-10">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.map((member) => {
            const isYou = currentUserId === member.userId;

            if (!user) return null;

            return (
              <TableRow key={member.userId} highlighted={isYou}>
                <TableCell className="font-medium whitespace-nowrap">
                  {user.name}
                  {isYou && (
                    <span className="ml-2 text-xs text-muted">(you)</span>
                  )}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">{member.role}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <TagOverflow
                    items={member.permissions.map((perm) => ({
                      label: perm.replace(/_/g, " "),
                      color: "primary",
                    }))}
                    max={2}
                    size="sm"
                  />
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <TableAction loading={false}>
                      <DropdownItem icon={<LuPencil className="h-4 w-4" />}>
                        Edit role
                      </DropdownItem>
                      <DropdownItem icon={<LuShield className="h-4 w-4" />}>
                        Manage permissions
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem
                        icon={<LuBan className="h-4 w-4" />}
                        destructive
                        disabled={isYou}
                      >
                        Suspend
                      </DropdownItem>
                      <DropdownItem
                        icon={<LuTrash2 className="h-4 w-4" />}
                        destructive
                        disabled={isYou}
                      >
                        Remove
                      </DropdownItem>
                    </TableAction>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {team.length === 0 && (
        <p className="text-center text-muted py-8">No team members yet.</p>
      )}
    </div>
  );
}
