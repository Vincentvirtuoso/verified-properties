"use client";

import { useState, useEffect } from "react";
import type { Enquiry } from "@affilhomes/shared/types/enquiry";
import { Role } from "@affilhomes/shared/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatRelativeTime } from "@/lib/formatters";
import { Avatar } from "@affilhomes/shared/ui/Avatar";
import { LuArrowRight, LuInfo, LuX } from "react-icons/lu";
import { Button, IconButton } from "@affilhomes/shared/ui";

const VIEWER_ROLE = Role.Viewer;

const roleLabel = (role: Role): string => {
  switch (role) {
    case Role.Agent:
      return "Agent";
    case Role.Company:
      return "Company";
    case Role.Viewer:
      return "Viewer";
    default:
      return String(role);
  }
};

const noteDismissedKey = (isAgentSide: boolean) =>
  `enquiries-role-note-dismissed-${isAgentSide ? "agent" : "viewer"}`;

type NoteState = "loading" | "open" | "dismissed";

interface EnquiryListProps {
  enquiries: Enquiry[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isAgentSide: boolean;
  showAgentName?: boolean;
  /**
   * Enables the role-switching tip for multi-role users (agent/company + viewer).
   * Defaults to `false` so locked contexts (e.g. /company/enquiries) stay silent.
   * Pass `true` on /enquiries.
   */
  isAgentOrViewer?: boolean;
  /**
   * Called when the user taps the switch-role CTA. The parent should reset its
   * list state (selectedId, enquiries, listLoading) and then `switchRole`.
   */
  onRoleSwitch?: (targetRole: Role) => Promise<void>;
}

export function EnquiryList({
  enquiries,
  selectedId,
  onSelect,
  isAgentSide,
  showAgentName = false,
  isAgentOrViewer = false,
  onRoleSwitch,
}: EnquiryListProps) {
  const { user } = useAuth();
  const [switchingRole, setSwitchingRole] = useState(false);
  const [noteState, setNoteState] = useState<NoteState>("loading");

  const hasViewerRole = user?.roles?.includes(VIEWER_ROLE) ?? false;
  const agentSideRole =
    user?.roles?.find((r) => r === Role.Agent || r === Role.Company) ?? null;

  let roleNote: { message: string; ctaLabel: string; targetRole: Role } | null =
    null;

  if (isAgentOrViewer && user) {
    if (isAgentSide && hasViewerRole) {
      roleNote = {
        message:
          "You're viewing enquiries on your listings. Switch to Viewer to see enquiries you've made as a buyer.",
        ctaLabel: `Switch to ${roleLabel(VIEWER_ROLE)}`,
        targetRole: VIEWER_ROLE,
      };
    } else if (!isAgentSide && agentSideRole) {
      roleNote = {
        message: `You're viewing enquiries you've made. Switch to ${roleLabel(
          agentSideRole,
        )} to see enquiries buyers sent about your listings.`,
        ctaLabel: `Switch to ${roleLabel(agentSideRole)}`,
        targetRole: agentSideRole,
      };
    }
  }

  // Hydrate dismissal state from localStorage once the note is known to apply.
  // Starting in "loading" avoids an SSR/hydration flash of the wrong state.
  useEffect(() => {
    if (!roleNote) {
      setNoteState("loading");
      return;
    }
    let stored = false;
    try {
      stored =
        typeof window !== "undefined" &&
        window.localStorage.getItem(noteDismissedKey(isAgentSide)) === "1";
    } catch {
      stored = false;
    }
    setNoteState(stored ? "dismissed" : "open");
  }, [isAgentSide, Boolean(roleNote)]);

  const dismissNote = () => {
    setNoteState("dismissed");
    try {
      window.localStorage.setItem(noteDismissedKey(isAgentSide), "1");
    } catch {}
  };

  const reopenNote = () => {
    setNoteState("open");
    try {
      window.localStorage.removeItem(noteDismissedKey(isAgentSide));
    } catch {}
  };

  const handleSwitchRole = async () => {
    if (!roleNote || !onRoleSwitch || switchingRole) return;
    setSwitchingRole(true);
    try {
      await onRoleSwitch(roleNote.targetRole);
    } finally {
      setSwitchingRole(false);
    }
  };

  const showExpandedNote = roleNote && noteState === "open";
  const showCollapsedNote = roleNote && noteState === "dismissed";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {showExpandedNote && roleNote && (
        <div className="border-b border-border bg-linear-to-br from-primary/10 via-primary/5 to-transparent px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <LuInfo className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-relaxed text-foreground">
                {roleNote.message}
              </p>
              <Button
                type="button"
                onClick={handleSwitchRole}
                disabled={switchingRole || !onRoleSwitch}
                size="xs"
                className="mt-2 rounded-md py-1"
                showArrow
                loadingText="Switching…"
                isLoading={switchingRole}
              >
                {roleNote.ctaLabel}
              </Button>
            </div>
            <IconButton
              type="button"
              onClick={dismissNote}
              aria-label="Dismiss role tip"
              label="Dismiss role tip"
              title="Dismiss role tip"
              size="xs"
              className="p-1.5"
              icon={<LuX className="h-3.5 w-3.5" />}
            />
          </div>
        </div>
      )}

      {showCollapsedNote && (
        <div className="flex items-center justify-end border-b border-border bg-muted/10 px-3 py-1">
          <button
            type="button"
            onClick={reopenNote}
            className="inline-flex items-center gap-1 rounded p-1.5 text-[11px] font-medium text-muted transition-colors hover:bg-muted/30 hover:text-foreground"
            aria-label="Show role tip"
          >
            <LuInfo className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {enquiries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-muted">
            {isAgentSide
              ? "No enquiries yet on your listings."
              : "You haven't enquired about any properties yet."}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {enquiries.map((enquiry) => {
            const isActive = enquiry.id === selectedId;
            return (
              <div
                key={enquiry.id}
                onClick={() => onSelect(enquiry.id)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                  isActive ? "bg-primary/5" : "hover:bg-muted/30"
                }`}
              >
                <Avatar
                  src={enquiry.propertyImage}
                  name={isAgentSide ? enquiry.propertyTitle : enquiry.agentName}
                  size={50}
                  shape="square"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {isAgentSide ? enquiry.buyerName : enquiry.propertyTitle}
                    </p>
                    {enquiry.unreadCount > 0 && (
                      <span className="shrink-0 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {isAgentSide ? enquiry.propertyTitle : enquiry.agentName}
                  </p>
                  {showAgentName && (
                    <p className="text-[11px] font-medium text-primary truncate mt-0.5">
                      {enquiry.agentName}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-xs text-muted truncate flex-1">
                      {enquiry.lastEventPreview}
                    </p>
                    <span className="text-[10px] text-muted shrink-0">
                      {formatRelativeTime(enquiry.lastEventAt, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
