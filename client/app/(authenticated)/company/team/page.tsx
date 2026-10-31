"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowLeft,
  LuEye,
  LuMail,
  LuRefreshCw,
  LuShieldCheck,
  LuTrash2,
  LuUserPlus,
  LuUsers,
  LuUserRound,
  LuBuilding2,
  LuClock3,
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
import { Alert } from "@affilhomes/shared/ui/Alert";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function CompanyTeamPage() {
  const { user, companies, isLoading, refreshUser } = useAuth();
  const { confirm } = useConfirm();

  const companyId =
    typeof user?.companyId === "string" ? user.companyId : user?.companyId?._id;
  const company = companies.find((item) => item._id === companyId);

  const membership =
    company?.team.find((member) => member.userId === user?._id) ?? null;
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
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteDraft, setInviteDraft] = useState<InviteDraft | null>(null);
  const [selected, setSelected] = useState<CompanyMember | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const teamId = company?._id;

  const loadInvitations = useCallback(async () => {
    if (!teamId || !canManageMembers) {
      setInvitations([]);
      return;
    }

    setInvitationsLoading(true);
    try {
      setInvitations(await listPendingInvitations(teamId));
      setActionError(null);
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Couldn't load pending invitations."),
      );
    } finally {
      setInvitationsLoading(false);
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
      message: `The invitation link sent to ${invitation.email} will stop working.`,
      confirmLabel: "Cancel invitation",
      cancelLabel: "Keep it",
      variant: "danger",
    });
    if (!ok) return;

    setActionError(null);
    setNotice(null);
    setBusyAction(`invite:${invitation.id}`);

    try {
      await revokeCompanyInvitation(invitation.id);
      setNotice(`Invitation to ${invitation.email} cancelled.`);
      await loadInvitations();
    } catch (error) {
      setActionError(getErrorMessage(error, "Couldn't cancel the invitation."));
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemove = async (member: CompanyMember) => {
    if (!teamId) return;

    const ok = await confirm({
      title: "Remove team member?",
      message:
        "They will lose access to this company's dashboard and listings. You can invite them again later.",
      confirmLabel: "Remove member",
      cancelLabel: "Keep member",
      variant: "danger",
    });
    if (!ok) return;

    setActionError(null);
    setNotice(null);
    setBusyAction(`member:${member.userId}`);

    try {
      await removeCompanyMember(teamId, member.userId);
      await refreshUser();
      setNotice("Team member removed successfully.");
    } catch (error) {
      setActionError(getErrorMessage(error, "Couldn't remove this member."));
    } finally {
      setBusyAction(null);
    }
  };

  if (isLoading) return <PageSpinner label="Loading team" />;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-muted">Sign in to view your team.</p>
      </div>
    );
  }

  if (!company || !membership) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/10">
          <LuUsers className="h-7 w-7 text-muted" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            No team to show
          </h2>
          <p className="text-sm leading-6 text-muted">
            You&apos;re not currently a member of a company team.
          </p>
        </div>
        <Button
          href="/dashboard"
          variant="outline"
          leftIcon={<LuArrowLeft className="h-4 w-4" />}
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  const admins = company.team.filter(
    (member) => member.role === "admin",
  ).length;
  const memberCount = company.team.length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8 sm:space-y-8">
      <Breadcrumbs
        items={[
          {
            href: "/company/dashboard",
            label: "Dashboard",
          },
          { label: "Team" },
        ]}
      />

      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Team Management
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Manage the people who have access to your company workspace, their
              roles and permissions.
            </p>
          </div>
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

      {(notice || actionError) && (
        <div className="space-y-2" aria-live="polite">
          {notice && (
            <div
              role="status"
              className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/70 dark:bg-emerald-900/10 dark:text-emerald-200"
            >
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="shrink-0 text-xs font-semibold underline underline-offset-2"
                aria-label="Dismiss success message"
              >
                Dismiss
              </button>
            </div>
          )}

          {actionError && (
            <Alert onDismiss={() => setActionError(null)}>
              <span>{actionError}</span>
            </Alert>
          )}
        </div>
      )}

      <section aria-label="Team overview" className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Team overview
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            A snapshot of your company&apos;s team and access.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Team members"
            value={memberCount}
            icon={LuUsers}
            accent="amber"
          />
          <StatCard
            label="Administrators"
            value={admins}
            icon={LuShieldCheck}
            accent="info"
          />
          <StatCard
            label="Pending invitations"
            value={canManageMembers ? invitations.length : "—"}
            icon={LuMail}
            accent="violet"
          />
          <StatCard
            label="Active listings"
            value={company.activeListings}
            icon={LuBuilding2}
            accent="emerald"
          />
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        aria-labelledby="team-members-heading"
      >
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                id="team-members-heading"
                className="text-base font-semibold text-foreground"
              >
                Members
              </h2>
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-muted/10 px-2 py-0.5 text-xs font-medium tabular-nums text-muted">
                {memberCount}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Review roles, permissions and access to this workspace.
            </p>
          </div>
          {canManageMembers && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<LuUserPlus className="h-3.5 w-3.5" />}
              onClick={() => openInvite()}
            >
              Add member
            </Button>
          )}
        </div>

        {memberCount === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/10">
              <LuUserRound className="h-5 w-5 text-muted" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                No team members yet
              </p>
              <p className="max-w-sm text-xs leading-5 text-muted">
                Invite trusted colleagues to help manage your company.
              </p>
            </div>
            {canManageMembers && (
              <Button size="sm" onClick={() => openInvite()}>
                Invite your first member
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table compact unstyled>
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
                  const isBusy = busyAction === `member:${member.userId}`;

                  return (
                    <TableRow key={member.userId} highlighted={isYou}>
                      <TableCell className="min-w-45">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                          >
                            <LuUserRound className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {isYou ? "You" : "Team member"}
                            </p>
                            {isYou && (
                              <p className="text-xs text-muted">Your account</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-muted/10 px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                          {member.role}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-47.5">
                        {member.role === "admin" ? (
                          <span className="text-xs text-muted">
                            All permissions
                          </span>
                        ) : member.permissions.length > 0 ? (
                          <TagOverflow
                            items={member.permissions.map((permission) => ({
                              label: PERMISSION_LABELS[permission],
                              color: "primary",
                            }))}
                            max={2}
                            size="sm"
                          />
                        ) : (
                          <span className="text-xs text-muted">
                            No permissions assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelected(member)}
                            aria-label="Member Details"
                            title="View Member Details"
                          >
                            <LuEye className="h-4 w-4" />
                          </Button>
                          {canRemove(member) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!!busyAction}
                              className="text-rose-600 hover:text-rose-700"
                              aria-label="Remove"
                              title="Remove Member"
                              onClick={() => void handleRemove(member)}
                              isLoading={isBusy}
                            >
                              <LuTrash2 className="h-4 w-4" />
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
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/2.5 px-4 py-3 text-xs text-muted sm:px-5">
          <span>
            {memberCount} {memberCount === 1 ? "person" : "people"} with team
            access
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LuShieldCheck className="h-3.5 w-3.5" />
            Access is controlled by roles and permissions
          </span>
        </div>
      </section>

      {canManageMembers && (
        <section
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          aria-labelledby="pending-invites-heading"
        >
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="pending-invites-heading"
                  className="text-base font-semibold text-foreground"
                >
                  Pending invitations
                </h2>
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-muted/10 px-2 py-0.5 text-xs font-medium tabular-nums text-muted">
                  {invitations.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Invitations that have been sent but not yet accepted.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={invitationsLoading}
              leftIcon={
                <LuRefreshCw
                  className={`h-3.5 w-3.5 ${invitationsLoading ? "animate-spin" : ""}`}
                />
              }
              onClick={() => void loadInvitations()}
            >
              Refresh
            </Button>
          </div>

          {invitationsLoading && invitations.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted">
              <LuRefreshCw className="h-4 w-4 animate-spin" />
              Loading invitations…
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/10">
                <LuMail className="h-4 w-4 text-muted" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No pending invitations
              </p>
              <p className="max-w-sm text-xs leading-5 text-muted">
                When you invite someone, their invitation will appear here until
                they accept or it expires.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {invitations.map((invitation) => {
                const isBusy = busyAction === `invite:${invitation.id}`;

                return (
                  <li
                    key={invitation.id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/10 text-muted">
                        <LuMail className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {invitation.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                          <span className="capitalize">{invitation.role}</span>
                          {invitation.role === "member" &&
                            invitation.permissions.length > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {invitation.permissions
                                    .map(
                                      (permission) =>
                                        PERMISSION_LABELS[permission],
                                    )
                                    .join(", ")}
                                </span>
                              </>
                            )}
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <LuClock3 className="h-3 w-3" />
                            Expires {formatDate(invitation.expiresAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!!busyAction}
                        leftIcon={<LuRefreshCw className="h-3.5 w-3.5" />}
                        onClick={() =>
                          openInvite({
                            email: invitation.email,
                            role: invitation.role,
                            permissions: invitation.permissions,
                          })
                        }
                      >
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!!busyAction}
                        className="text-rose-600 hover:text-rose-700"
                        onClick={() => void handleRevoke(invitation)}
                      >
                        {isBusy ? "Cancelling…" : "Cancel"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-border bg-muted/2.5 px-4 py-3 text-xs text-muted sm:px-5">
            Only invitations awaiting acceptance are shown here.
          </div>
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
