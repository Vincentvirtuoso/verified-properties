"use client";

import { useId, useState } from "react";
import { LuChevronDown, LuUserRound } from "react-icons/lu";
import { Badge } from "@affilhomes/shared/ui";
import { CompanyMember, CompanyMemberDetails } from "@affilhomes/shared/types";
import { getErrorMessage } from "@/utils";
import { getCompanyMemberDetails } from "@affilhomes/shared/supabase";

const ROLE_LABELS: Record<CompanyMember["role"], string> = {
  admin: "Admin",
  member: "Member",
};

const PERMISSION_LABELS: Record<CompanyMember["permissions"][number], string> =
  {
    manage_listings: "Manage listings",
    manage_members: "Manage members",
    view_analytics: "View analytics",
  };

type DetailsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; details: CompanyMemberDetails };

interface TeamMemberRowProps {
  companyId: string;
  member: CompanyMember;
  currentUserId: string;
}

export function TeamMemberRow({
  companyId,
  member,
  currentUserId,
}: TeamMemberRowProps) {
  const isCurrentUser = member.userId === currentUserId;
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<DetailsState>({ status: "idle" });
  const panelId = useId();

  async function loadDetails() {
    setDetails({ status: "loading" });
    try {
      const result = await getCompanyMemberDetails(companyId, member.userId);
      setDetails({ status: "ready", details: result });
    } catch (err) {
      setDetails({
        status: "error",
        message: getErrorMessage(err, "Couldn't load these details."),
      });
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    // Fetch once, on first open. Later opens reuse the result.
    if (next && details.status !== "ready" && details.status !== "loading") {
      void loadDetails();
    }
  }

  return (
    <li className="py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <LuUserRound size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {isCurrentUser ? "You" : "Team member"}
            </p>
            <p className="text-xs text-muted">{ROLE_LABELS[member.role]}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <ul
            className="flex flex-wrap gap-1 sm:justify-end"
            aria-label="Permissions"
          >
            {member.permissions.length === 0 ? (
              <li className="text-xs text-muted">No permissions</li>
            ) : (
              member.permissions.map((perm) => (
                <li key={perm}>
                  <Badge variant="secondary" className="text-[10px]">
                    {PERMISSION_LABELS[perm]}
                  </Badge>
                </li>
              ))
            )}
          </ul>

          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="inline-flex items-center gap-1 self-start rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:self-end"
          >
            {open ? "Hide details" : "Details"}
            <LuChevronDown
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {open && (
        <div
          id={panelId}
          className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm"
        >
          {details.status === "loading" && (
            <p className="text-xs text-muted">Loading details…</p>
          )}

          {details.status === "error" && (
            <div className="flex items-center justify-between gap-3">
              <p
                role="alert"
                className="text-xs text-rose-600 dark:text-rose-400"
              >
                {details.message}
              </p>
              <button
                type="button"
                onClick={loadDetails}
                className="text-xs font-semibold text-primary underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {details.status === "ready" && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
              <dt className="text-muted">Name</dt>
              <dd className="text-foreground">
                {details.details.name ?? "Not set"}
              </dd>

              <dt className="text-muted">Email</dt>
              <dd className="break-all">
                {details.details.email ? (
                  <a
                    href={`mailto:${details.details.email}`}
                    className="text-primary hover:underline"
                  >
                    {details.details.email}
                  </a>
                ) : (
                  "Not set"
                )}
              </dd>

              <dt className="text-muted">Joined</dt>
              <dd className="text-foreground">
                {details.details.joinedAt
                  ? new Date(details.details.joinedAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : "Not available"}
              </dd>
            </dl>
          )}
        </div>
      )}
    </li>
  );
}
