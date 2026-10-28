"use client";

import { useEffect, useState } from "react";
import { Button } from "@affilhomes/shared/ui/Button";
import { Field } from "@affilhomes/shared/ui/Field";
import { Checkbox } from "@affilhomes/shared/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import type { CompanyPermission } from "@affilhomes/shared/types";
import { getErrorMessage } from "@/utils";
import {
  ALL_PERMISSIONS,
  inviteCompanyMember,
  type InvitableRole,
} from "@affilhomes/shared/supabase";
import { RadioGroup } from "@affilhomes/shared/ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PERMISSION_OPTIONS: {
  value: CompanyPermission;
  label: string;
  hint: string;
}[] = [
  {
    value: "manage_listings",
    label: "Manage listings",
    hint: "Create, edit and publish listings.",
  },
  {
    value: "manage_members",
    label: "Manage members",
    hint: "Invite and remove team members.",
  },
  {
    value: "view_analytics",
    label: "View analytics",
    hint: "See listing performance and enquiries.",
  },
];

export interface InviteDraft {
  email: string;
  role: InvitableRole;
  permissions: CompanyPermission[];
}

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  /** Permissions the signed-in user can hand on. */
  grantable: CompanyPermission[];
  canGrantAdmin: boolean;
  /** Pre-fills the form, used for resending. */
  initial?: InviteDraft | null;
  onSent: (email: string) => void;
}

const EMPTY: InviteDraft = { email: "", role: "member", permissions: [] };

export function InviteMemberModal({
  open,
  onClose,
  companyId,
  grantable,
  canGrantAdmin,
  initial,
  onSent,
}: InviteMemberModalProps) {
  const [draft, setDraft] = useState<InviteDraft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(initial ?? EMPTY);
      setError(null);
    }
  }, [open, initial]);

  const togglePermission = (perm: CompanyPermission) => {
    setDraft((d) => ({
      ...d,
      permissions: d.permissions.includes(perm)
        ? d.permissions.filter((p) => p !== perm)
        : [...d.permissions, perm],
    }));
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const email = draft.email.trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (draft.role === "member" && draft.permissions.length === 0) {
      setError("Choose at least one permission for a team member.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      await inviteCompanyMember({
        companyId,
        email,
        role: draft.role,
        permissions:
          draft.role === "admin" ? ALL_PERMISSIONS : draft.permissions,
      });
      onSent(email);
      onClose();
    } catch (err) {
      setError(
        getErrorMessage(err, "Couldn't send the invitation. Try again."),
      );
    } finally {
      setSending(false);
    }
  }

  const roleOptions: {
    value: InvitableRole;
    label: string;
    description: string;
    disabled: boolean;
    disabledHint?: string;
  }[] = [
    {
      value: "member",
      label: "Member",
      description: "Works within the permissions you choose.",
      disabled: false,
    },
    {
      value: "admin",
      label: "Admin",
      description:
        "Full access, including team management and remittance details.",
      disabled: !canGrantAdmin,
      disabledHint: "Only company admins can invite other admins.",
    },
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-6 p-6">
        <header>
          <h2 className="text-xl font-semibold">Invite a team member</h2>
          <p className="mt-1 text-sm text-muted">
            They&apos;ll get an email with a link. It works once and expires in
            7 days.
          </p>
        </header>

        <Field
          label="Email address"
          name="inviteEmail"
          type="email"
          autoComplete="off"
          placeholder="colleague@company.com"
          value={draft.email}
          onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          required
        />

        <RadioGroup
          name="inviteRole"
          label="Role"
          options={roleOptions}
          value={draft.role}
          onChange={(value) =>
            setDraft((d) => ({ ...d, role: value as InvitableRole }))
          }
        />

        {draft.role === "member" && (
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium text-foreground">
              Permissions
            </legend>
            {PERMISSION_OPTIONS.map((opt) => {
              const allowed = grantable.includes(opt.value);
              return (
                <Checkbox
                  key={opt.value}
                  name={`perm-${opt.value}`}
                  checked={draft.permissions.includes(opt.value)}
                  disabled={!allowed}
                  onChange={() => togglePermission(opt.value)}
                  label={
                    <span className="text-sm">
                      <span className="block text-foreground">{opt.label}</span>
                      <span className="block text-xs text-muted">
                        {allowed
                          ? opt.hint
                          : "You don't have this permission, so you can't grant it."}
                      </span>
                    </span>
                  }
                />
              );
            })}
          </fieldset>
        )}

        {draft.role === "admin" && (
          <p className="rounded-lg bg-muted/30 p-3 text-xs text-muted">
            Admins get every permission.
          </p>
        )}

        {error && (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <footer className="flex justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={sending} isLoading={sending}>
            {sending ? "Sending…" : "Send invitation"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
