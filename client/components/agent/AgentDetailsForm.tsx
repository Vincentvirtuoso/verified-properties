"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateAgentSettings,
  type AgentSubRole,
} from "@/lib/agent-settings.api";
import { getErrorMessage } from "@affilhomes/shared/utils";
import { Button, Field } from "@affilhomes/shared/ui";
import Select from "@affilhomes/shared/ui/Select";
import { Callout } from "@affilhomes/shared/ui/Callout";

const SUB_ROLES: { value: AgentSubRole; label: string }[] = [
  { value: "realtor", label: "Realtor" },
  { value: "lawyer", label: "Lawyer" },
  { value: "surveyor", label: "Surveyor" },
  { value: "landlord", label: "Landlord" },
];

export function AgentDetailsForm() {
  const { user, refreshUser } = useAuth();
  const ap = user?.agentProfile;

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    user?.whatsappNumber ?? "",
  );
  const [subRole, setSubRole] = useState<AgentSubRole>(
    (ap?.subRole as AgentSubRole) ?? "realtor",
  );
  const [licenseNumber, setLicenseNumber] = useState(ap?.licenseNumber ?? "");
  const [brokerage, setBrokerage] = useState(ap?.brokerage ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const licenceChanged =
    licenseNumber.trim() !== (ap?.licenseNumber ?? "").trim();
  const isVerified = ap?.verificationStatus === "verified";
  const showsLicence = subRole === "lawyer" || subRole === "surveyor";
  const showsBrokerage = subRole === "realtor";

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateAgentSettings(user._id, {
        name,
        phone,
        whatsappNumber,
        subRole,
        licenseNumber,
        brokerage,
      });
      await refreshUser();
      setSaved(true);
    } catch (e) {
      setError(getErrorMessage(e, "Couldn't save your details. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const labelClass = "mb-1 block text-xs font-medium text-muted";

  return (
    <>
      <form
        className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            id="agent-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Field
            label="Phone"
            id="agent-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Field
            label="WhatsApp number"
            id="agent-whatsapp"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            required
          />
          <Select
            id="agent-subrole"
            value={subRole}
            onChange={(value) => setSubRole(value as AgentSubRole)}
            label="I am a"
            options={SUB_ROLES}
          />

          {showsLicence && (
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="agent-licence">
                {subRole === "lawyer"
                  ? "Bar number"
                  : "Surveyor registration number"}
              </label>
              <input
                id="agent-licence"
                className={inputClass}
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
              {isVerified && licenceChanged && (
                <p className="mt-1.5 text-xs text-warning">
                  Changing this number sends your account back for verification.
                </p>
              )}
            </div>
          )}

          {showsBrokerage && (
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="agent-brokerage">
                Brokerage (optional)
              </label>
              <input
                id="agent-brokerage"
                className={inputClass}
                value={brokerage}
                onChange={(e) => setBrokerage(e.target.value)}
                placeholder="Leave blank if independent"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            isLoading={saving}
            loadingText="Saving..."
          >
            Save changes
          </Button>
        </div>
      </form>

      <Callout
        open={saved}
        onClose={() => setSaved(false)}
        variant="success"
        position="bottom-right"
        title="Saved"
        icon={null}
      >
        Your details were updated.
      </Callout>

      <Callout
        open={!!error}
        onClose={() => setError(null)}
        variant="danger"
        position="bottom-right"
        title="Couldn't save"
      >
        {error}
      </Callout>
    </>
  );
}
