"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuEye,
  LuMail,
  LuRefreshCw,
  LuTrash2,
  LuUserPlus,
  LuUsers,
} from "react-icons/lu";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmDialog";
import { StatCard } from "@/components/ui";
import { Breadcrumbs } from "@/components/common/BreadCrumbs";
import { Button } from "@affilhomes/shared/ui/Button";
import { PageSpinner } from "@affilhomes/shared/ui/Spinner";
import { TagOverflow } from "@affilhomes/shared/ui/TagOverflow";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@affilhomes/shared/ui/Table";
import type {
  CompanyMember,
  CompanyPermission,
} from "@affilhomes/shared/types";
import { getErrorMessage } from "@/utils";
import {
  InviteMemberModal,
  type InviteDraft,
} from "@/components/company/InviteMemberModal";
import { MemberDetailsModal } from "@/components/company/MemberDetailsModal";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  listPendingInvitations,
  removeCompanyMember,
  revokeCompanyInvitation,
  type CompanyInvitation,
} from "@affilhomes/shared/supabase";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function CompanyTeamPage() {
  const { user, companies, isLoading, refreshUser } = useAuth();
  const { confirm } = useConfirm();

  const companyId =
    typeof user?.companyId === "string" ? user.companyId : user?.companyId?._id;
  const company = companies.find((c) => c._id === companyId);

  const membership = company?.team.find((m) => m.userId === user?._id) ?? null;
  const isAdmin = membership?.role === "admin";
  const myPermissions: CompanyPermission[] = isAdmin
    ? ALL_PERMISSIONS
    : (membership?.permissions ?? []);
  const canManageMembers = myPermissions.includes("manage_members");

  const canRemove = (member: CompanyMember) =>
    !!user &&
    canManageMembers &&
    member.userId !== user._id &&
    (member.role !== "admin" || !!isAdmin);

  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteDraft, setInviteDraft] = useState<InviteDraft | null>(null);
  const [selected, setSelected] = useState<CompanyMember | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const teamId = company?._id;

  const loadInvitations = useCallback(async () => {
    if (!teamId || !canManageMembers) return;
    try {
      setInvitations(await listPendingInvitations(teamId));
    } catch (err) {
      setActionError(
        getErrorMessage(err, "Couldn't load pending invitations."),
      );
    }
  }, [teamId, canManageMembers]);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  const openInvite = (draft: InviteDraft | null = null) => {
    setActionError(null);
    setInviteDraft(draft);
    setInviteOpen(true);
  };

  const handleInviteSent = (email: string) => {
    setNotice(`Invitation sent to ${email}.`);
    void loadInvitations();
  };

  const handleRevoke = async (invitation: CompanyInvitation) => {
    const ok = await confirm({
      title: "Cancel invitation?",
      message: `The link sent to ${invitation.email} will stop working.`,
      confirmLabel: "Cancel invitation",
      cancelLabel: "Keep it",
      variant: "danger",
    });
    if (!ok) return;

    setActionError(null);
    try {
      await revokeCompanyInvitation(invitation.id);
      setNotice(`Invitation to ${invitation.email} cancelled.`);
      await loadInvitations();
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't cancel the invitation."));
    }
  };

  const handleRemove = async (member: CompanyMember) => {
    if (!teamId) return;
    const ok = await confirm({
      title: "Remove from team?",
      message:
        "They lose access to this company's dashboard and listings. You can invite them again later.",
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;

    setActionError(null);
    try {
      await removeCompanyMember(teamId, member.userId);
      await refreshUser();
      setNotice("Team member removed.");
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't remove this member."));
    }
  };

  if (isLoading) return <PageSpinner label="Loading team" />;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted">Sign in to view your team.</p>
      </div>
    );
  }

  if (!company || !membership) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <LuUsers className="h-16 w-16 text-muted/40" aria-hidden="true" />
        <h2 className="text-xl font-semibold">No team to show</h2>
        <p className="max-w-md text-center text-muted">
          You&apos;re not a member of a company team.
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const admins = company.team.filter((m) => m.role === "admin").length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { href: "/company/dashboard", label: "Dashboard" },
          { label: "Team" },
        ]}
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="mt-1 text-sm text-muted">
            People who can manage {company.name}&apos;s listings and account.
          </p>
        </div>
        {canManageMembers && (
          <Button
            leftIcon={<LuUserPlus className="h-4 w-4" />}
            onClick={() => openInvite()}
          >
            Invite member
          </Button>
        )}
      </header>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/10 dark:text-emerald-200"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-semibold underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {actionError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Members"
          value={company.team.length}
          icon={LuUsers}
          accent="primary"
        />
        <StatCard label="Admins" value={admins} icon={LuUsers} accent="info" />
        <StatCard
          label="Pending invites"
          value={invitations.length}
          icon={LuMail}
          accent="violet"
        />
        <StatCard
          label="Listings managed"
          value={company.activeListings}
          icon={LuUsers}
          accent="emerald"
        />
      </div>

      <section className="space-y-3" aria-labelledby="team-members-heading">
        <h2 id="team-members-heading" className="text-lg font-semibold">
          Members
        </h2>
        <div className="overflow-x-auto">
          <Table striped compact>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {company.team.map((member) => {
                const isYou = member.userId === user._id;
                return (
                  <TableRow key={member.userId} highlighted={isYou}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"
                        >
                          <LuUsers size={14} />
                        </span>
                        {isYou ? "You" : "Team member"}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{member.role}</TableCell>
                    <TableCell>
                      <TagOverflow
                        items={member.permissions.map((p) => ({
                          label: PERMISSION_LABELS[p],
                          color: "primary",
                        }))}
                        max={2}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<LuEye className="h-4 w-4" />}
                          onClick={() => setSelected(member)}
                        >
                          Details
                        </Button>
                        {canRemove(member) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700"
                            leftIcon={<LuTrash2 className="h-4 w-4" />}
                            onClick={() => handleRemove(member)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {canManageMembers && (
        <section
          className="space-y-3"
          aria-labelledby="pending-invites-heading"
        >
          <div className="flex items-center justify-between">
            <h2 id="pending-invites-heading" className="text-lg font-semibold">
              Pending invitations
            </h2>
            <span className="text-xs tabular-nums text-muted">
              {invitations.length} pending
            </span>
          </div>

          {invitations.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
              No pending invitations. Invite someone to add them to the team.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <LuMail
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-muted"
                      />
                      <span className="truncate">{inv.email}</span>
                    </p>
                    <p className="text-xs text-muted">
                      <span className="capitalize">{inv.role}</span>
                      {inv.role === "member" && inv.permissions.length > 0 && (
                        <>
                          {" "}
                          ·{" "}
                          {inv.permissions
                            .map((p) => PERMISSION_LABELS[p])
                            .join(", ")}
                        </>
                      )}
                      {" · "}Expires {formatDate(inv.expiresAt)}
                    </p>
                  </div>

                  <div className="flex gap-1 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<LuRefreshCw className="h-3.5 w-3.5" />}
                      onClick={() =>
                        openInvite({
                          email: inv.email,
                          role: inv.role,
                          permissions: inv.permissions,
                        })
                      }
                    >
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700"
                      onClick={() => handleRevoke(inv)}
                    >
                      Cancel
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {teamId && (
        <InviteMemberModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          companyId={teamId}
          grantable={myPermissions}
          canGrantAdmin={!!isAdmin}
          initial={inviteDraft}
          onSent={handleInviteSent}
        />
      )}

      {teamId && (
        <MemberDetailsModal
          open={!!selected}
          onClose={() => setSelected(null)}
          companyId={teamId}
          member={selected}
          isYou={selected?.userId === user._id}
        />
      )}
    </div>
  );
}
