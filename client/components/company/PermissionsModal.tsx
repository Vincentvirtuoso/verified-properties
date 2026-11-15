"use client";

import { useEffect, useState } from "react";
import { LuShieldCheck } from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui/Button";
import type {
  CompanyMember,
  CompanyPermission,
} from "@affilhomes/shared/types";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  type InvitableRole,
} from "@affilhomes/shared/supabase";
import { Modal } from "../ui";
import { Checkbox, RadioGroup } from "@affilhomes/shared/ui";
import { Alert } from "@affilhomes/shared/ui/Alert";

// Billing and enquiry access have their own toggles. This modal never sends them.
const SEPARATE: CompanyPermission[] = ["manage_billing", "manage_enquiries"];
const STANDARD = ALL_PERMISSIONS.filter((p) => !SEPARATE.includes(p));

interface PermissionsModalProps {
  open: boolean;
  onClose: () => void;
  member: CompanyMember | null;
  /** Owner: may change the role. Everyone else: permissions only. */
  isOwner: boolean;
  /** The standard permissions the viewer is allowed to grant. */
  grantable: CompanyPermission[];
  saving?: boolean;
  error?: string | null;
  onSave: (
    role: InvitableRole,
    permissions: CompanyPermission[],
  ) => void | Promise<void>;
}

export function PermissionsModal({
  open,
  onClose,
  member,
  isOwner,
  grantable,
  saving = false,
  error,
  onSave,
}: PermissionsModalProps) {
  const [role, setRole] = useState<InvitableRole>("member");
  const [selected, setSelected] = useState<CompanyPermission[]>([]);

  useEffect(() => {
    if (open && member) {
      setRole(member.role === "admin" ? "admin" : "member");
      setSelected(member.permissions.filter((p) => STANDARD.includes(p)));
    }
  }, [open, member]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, saving, onClose]);

  if (!open || !member) return null;

  const originalRole: InvitableRole =
    member.role === "admin" ? "admin" : "member";
  const roleChanged = isOwner && role !== originalRole;
  const demoting = roleChanged && originalRole === "admin" && role === "member";

  const originalKey = member.permissions
    .filter((p) => STANDARD.includes(p))
    .sort()
    .join(",");
  const currentKey = [...selected].sort().join(",");
  const permissionsChanged = currentKey !== originalKey;

  const isDirty = roleChanged || permissionsChanged;

  const editable = STANDARD.filter((p) => grantable.includes(p));
  const locked = STANDARD.filter(
    (p) => member.permissions.includes(p) && !grantable.includes(p),
  );

  const handleSave = () => {
    void onSave(role, selected);
  };

  return (
    <Modal onClose={onClose} open={open}>
      <div>
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LuShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Edit member
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {isOwner
                ? "Change their role or what they can do."
                : "Change what this member can do."}
            </p>
          </div>
        </header>

        <div className="space-y-5 px-5 py-4">
          {isOwner ? (
            <RadioGroup
              label="ROLE"
              name="role"
              options={[
                {
                  label: "Member",
                  description: "Only the permissions you choose below.",
                  value: "member",
                },
                {
                  label: "Admin",
                  description:
                    "Standard permissions. Billing and enquiry access are granted separately.",
                  value: "admin",
                },
              ]}
              value={role}
              onChange={(r) => setRole(r as InvitableRole)}
            />
          ) : (
            <div className="rounded-xl bg-muted/10 px-3 py-2.5 text-xs text-muted">
              Role:{" "}
              <span className="font-medium text-foreground capitalize">
                {originalRole}
              </span>
              . Only the company owner can change roles.
            </div>
          )}

          {demoting && (
            <Alert>
              <span className="text-xs">
                Demoting this admin removes their billing and enquiry access.
              </span>
            </Alert>
          )}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Permissions
            </h3>

            {role === "admin" ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted">
                Admins get the standard permissions. Billing and enquiry access
                are managed on the team page.
              </p>
            ) : (
              <div className="space-y-2">
                {editable.map((permission) => (
                  <Checkbox
                    key={permission}
                    checked={selected.includes(permission)}
                    label={PERMISSION_LABELS[permission]}
                    disabled={saving}
                    onChange={() =>
                      setSelected((prev) =>
                        prev.includes(permission)
                          ? prev.filter((p) => p !== permission)
                          : [...prev, permission],
                      )
                    }
                  />
                ))}
                {locked.map((permission) => (
                  <div
                    key={permission}
                    className="flex items-start gap-3 px-2 py-2 opacity-60"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked
                      disabled
                      readOnly
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {PERMISSION_LABELS[permission]}
                      </p>
                      <p className="text-xs text-muted">
                        You can&apos;t change this.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <Alert className="mt-5">
                <span className="text-xs">{error}</span>
              </Alert>
            )}
          </section>
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-card px-5 py-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || saving}
            isLoading={saving}
            className="w-full sm:w-auto"
          >
            Save changes
          </Button>
        </footer>
      </div>
    </Modal>
  );
}
