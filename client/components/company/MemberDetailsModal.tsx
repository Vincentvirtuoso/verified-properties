"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type {
  CompanyMember,
  CompanyMemberDetails,
} from "@affilhomes/shared/types";
import { getErrorMessage } from "@/utils";
import {
  getCompanyMemberDetails,
  PERMISSION_LABELS,
} from "@affilhomes/shared/supabase";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; details: CompanyMemberDetails };

interface MemberDetailsModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  member: CompanyMember | null;
  isYou: boolean;
}

function DetailsSkeleton() {
  const labels = ["Name", "Email", "Joined", "Permissions"];

  return (
    <dl
      className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm"
      aria-busy="true"
      aria-label="Loading member details"
    >
      {labels.map((label) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="space-y-1">
            <Skeleton className="h-4 w-40 max-w-full" />
            {label === "Permissions" && (
              <>
                <Skeleton className="h-4 w-32 max-w-full" />
                <Skeleton className="h-4 w-28 max-w-full" />
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function MemberDetailsModal({
  open,
  onClose,
  companyId,
  member,
  isYou,
}: MemberDetailsModalProps) {
  const [state, setState] = useState<State>({ status: "loading" });
  const memberId = member?.userId;

  useEffect(() => {
    if (!open || !memberId) return;
    let cancelled = false;
    setState({ status: "loading" });

    getCompanyMemberDetails(companyId, memberId)
      .then((details) => {
        if (!cancelled) setState({ status: "ready", details });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: getErrorMessage(err, "Couldn't load these details."),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, memberId, companyId]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-5 p-6">
        <header>
          <h2 className="text-xl font-semibold">
            {isYou ? "Your details" : "Team member"}
          </h2>
          {member && (
            <p className="mt-1 text-sm capitalize text-muted">
              Role: <b className="inline-flex ml-1">{member.role}</b>
            </p>
          )}
        </header>

        {state.status === "loading" && <DetailsSkeleton />}

        {state.status === "error" && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {state.message}
          </p>
        )}

        {state.status === "ready" && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted">Name</dt>
            <dd className="text-foreground">
              {state.details.name ?? "Not set"}
            </dd>

            <dt className="text-muted">Email</dt>
            <dd className="break-all">
              {state.details.email ? (
                <a
                  href={`mailto:${state.details.email}`}
                  className="text-primary hover:underline"
                >
                  {state.details.email}
                </a>
              ) : (
                "Not set"
              )}
            </dd>

            <dt className="text-muted">Joined</dt>
            <dd className="text-foreground">
              {state.details.joinedAt
                ? new Date(state.details.joinedAt).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    },
                  )
                : "Not available"}
            </dd>

            <dt className="text-muted">Permissions</dt>
            <dd>
              {member && member.permissions.length > 0 ? (
                <ul className="space-y-1">
                  {member.permissions.map((p) => (
                    <li key={p} className="text-foreground">
                      {PERMISSION_LABELS[p]}
                    </li>
                  ))}
                </ul>
              ) : (
                "None"
              )}
            </dd>
          </dl>
        )}
      </div>
    </Modal>
  );
}
