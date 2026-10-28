"use client";

import { useEffect, useState } from "react";
import { Button } from "@affilhomes/shared/ui/Button";
import { Field } from "@affilhomes/shared/ui/Field";
import { PhoneField } from "@affilhomes/shared/ui/PhoneField";
import FileUpload from "@affilhomes/shared/ui/FileUpload";
import { Company, PopulatedUser, Role } from "@affilhomes/shared/types";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UserSettingsFormProps {
  user: PopulatedUser;
  company: Company | null;
  onClose: () => void;
}

const clean = (value: string) => value.trim() || undefined;

export function UserSettingsForm({
  user,
  company,
  onClose,
}: UserSettingsFormProps) {
  const { updateProfile, updateCompany } = useAuth();

  const agent = user.agentProfile;
  const isAgent = user.activeRole === Role.Agent && !!agent;
  const isCompany = user.activeRole === Role.Company && !!company;
  const isCompanyAdmin =
    isCompany &&
    !!company?.team?.some((m) => m.userId === user._id && m.role === "admin");

  // Personal
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [whatsapp, setWhatsapp] = useState(user.whatsappNumber || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");

  // Agent
  const [licenseNumber, setLicenseNumber] = useState(
    agent?.licenseNumber ?? "",
  );
  const [barNumber, setBarNumber] = useState(agent?.barNumber ?? "");
  const [surveyorRegNumber, setSurveyorRegNumber] = useState(
    agent?.surveyorRegNumber ?? "",
  );
  const [brokerage, setBrokerage] = useState(agent?.brokerage ?? "");

  // Company
  const [companyEmail, setCompanyEmail] = useState(company?.contactEmail ?? "");
  const [companyPhone, setCompanyPhone] = useState(company?.contactPhone ?? "");
  const [companyWhatsapp, setCompanyWhatsapp] = useState(
    company?.whatsappNumber ?? "",
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(company?.logo ?? "");
  const [bank, setBank] = useState({
    accountNumber: company?.remittanceDetails?.accountNumber ?? "",
    bankName: company?.remittanceDetails?.bankName ?? "",
    accountName: company?.remittanceDetails?.accountName ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Previews: show the new photo, and free the object URL when it changes.
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(user.avatar || "");
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile, user.avatar]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(company?.logo ?? "");
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile, company?.logo]);

  const wasVerified = agent?.verificationStatus === "verified";
  const credentialsChanged =
    isAgent &&
    (licenseNumber.trim() !== (agent?.licenseNumber ?? "") ||
      barNumber.trim() !== (agent?.barNumber ?? "") ||
      surveyorRegNumber.trim() !== (agent?.surveyorRegNumber ?? ""));

  const bankFilled = Object.values(bank).some((v) => v.trim() !== "");
  const bankComplete = Object.values(bank).every((v) => v.trim() !== "");

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!name.trim()) e.name = "Full name is required";

    if (isAgent && agent) {
      if (agent.subRole === "realtor" && !licenseNumber.trim())
        e.licenseNumber = "License number is required for realtors";
      if (agent.subRole === "lawyer" && !barNumber.trim())
        e.barNumber = "Bar number is required for lawyers";
      if (agent.subRole === "surveyor" && !surveyorRegNumber.trim())
        e.surveyorRegNumber = "Registration number is required for surveyors";
    }

    if (isCompany) {
      if (!EMAIL_RE.test(companyEmail.trim()))
        e.companyEmail = "Enter a valid contact email";
      if (isCompanyAdmin && bankFilled && !bankComplete)
        e.bank =
          "Enter the account number, bank name and account name, or clear all three.";
    }

    return e;
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaveError(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);

    try {
      const profileUpdates: Partial<PopulatedUser> = {
        name: name.trim(),
        phone: phone.trim(),
        whatsappNumber: whatsapp.trim(),
      };

      if (isAgent && agent) {
        profileUpdates.agentProfile = {
          ...agent,
          licenseNumber: clean(licenseNumber),
          barNumber: clean(barNumber),
          surveyorRegNumber: clean(surveyorRegNumber),
          brokerage: clean(brokerage),
        };
      }

      await updateProfile(
        profileUpdates,
        avatarFile ? { avatar: avatarFile } : undefined,
      );
    } catch (err) {
      setSaveError(
        getErrorMessage(err, "Couldn't save your profile. Please try again."),
      );
      setSaving(false);
      return;
    }

    if (isCompany && company) {
      try {
        await updateCompany(
          company._id,
          {
            contactEmail: companyEmail.trim(),
            contactPhone: companyPhone.trim() || null,
            whatsappNumber: companyWhatsapp.trim() || null,
            ...(isCompanyAdmin && {
              remittanceDetails: bankFilled
                ? {
                    accountNumber: bank.accountNumber.trim(),
                    bankName: bank.bankName.trim(),
                    accountName: bank.accountName.trim(),
                  }
                : null,
            }),
          },
          logoFile,
        );
      } catch (err) {
        setSaveError(
          `Your personal details were saved, but company details were not. ${getErrorMessage(
            err,
            "Please try again.",
          )}`,
        );
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onClose();
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col">
      <div className="space-y-8 p-6">
        <header>
          <h2 className="text-xl font-semibold">Edit profile</h2>
          <p className="mt-1 text-sm text-muted">
            Update your personal details
            {isAgent ? " and credentials" : ""}
            {isCompany ? " and company settings" : ""}.
          </p>
        </header>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Personal details
          </h3>

          <FileUpload
            variant="avatar"
            label="Profile photo"
            currentImageUrl={avatarPreview}
            onUploadComplete={(files) => setAvatarFile(files[0] ?? null)}
          />

          <Field
            label="Full name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />
          <PhoneField
            label="Phone number"
            name="phone"
            value={phone}
            onChange={setPhone}
            required={false}
          />
          <PhoneField
            label="WhatsApp number"
            name="whatsapp"
            value={whatsapp}
            onChange={setWhatsapp}
            required={false}
          />
        </section>

        {isAgent && agent && (
          <section className="space-y-4 border-t border-border pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Agent credentials
            </h3>

            {credentialsChanged && wasVerified && (
              <p
                role="note"
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-200"
              >
                Changing your license or registration number sends your profile
                back for verification. Your verified badge is removed until it
                is reviewed again.
              </p>
            )}

            {agent.subRole === "realtor" && (
              <>
                <Field
                  label="License number"
                  name="licenseNumber"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  error={errors.licenseNumber}
                  required
                />
                <Field
                  label="Brokerage / agency (optional)"
                  name="brokerage"
                  value={brokerage}
                  onChange={(e) => setBrokerage(e.target.value)}
                />
              </>
            )}

            {agent.subRole === "lawyer" && (
              <Field
                label="Supreme Court bar number"
                name="barNumber"
                value={barNumber}
                onChange={(e) => setBarNumber(e.target.value)}
                error={errors.barNumber}
                required
              />
            )}

            {agent.subRole === "surveyor" && (
              <Field
                label="SURCON registration number"
                name="surveyorRegNumber"
                value={surveyorRegNumber}
                onChange={(e) => setSurveyorRegNumber(e.target.value)}
                error={errors.surveyorRegNumber}
                required
              />
            )}
          </section>
        )}

        {isCompany && company && (
          <>
            <section className="space-y-4 border-t border-border pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Company
              </h3>

              <FileUpload
                variant="avatar"
                label="Company logo"
                currentImageUrl={logoPreview}
                onUploadComplete={(files) => setLogoFile(files[0] ?? null)}
              />

              <div className="space-y-1.5">
                <Field
                  label="Registered company name"
                  name="companyName"
                  value={company.name}
                  onChange={() => {}}
                  disabled
                />
                <p className="text-xs text-muted">
                  Locked after approval because it is checked against your CAC
                  certificate. To correct it, contact support.
                </p>
              </div>

              <Field
                label="Contact email"
                name="contactEmail"
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                error={errors.companyEmail}
                required
              />
              <PhoneField
                label="Contact phone"
                name="contactPhone"
                value={companyPhone}
                onChange={setCompanyPhone}
                required={false}
              />
              <PhoneField
                label="WhatsApp number"
                name="companyWhatsapp"
                value={companyWhatsapp}
                onChange={setCompanyWhatsapp}
                required={false}
              />
            </section>

            {isCompanyAdmin && (
              <section className="space-y-4 border-t border-border pt-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Remittance details
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Used to send your share of closed transactions. Visible only
                    to company admins.
                  </p>
                </div>

                <Field
                  label="Account number"
                  name="accountNumber"
                  value={bank.accountNumber}
                  onChange={(e) =>
                    setBank((prev) => ({
                      ...prev,
                      accountNumber: e.target.value,
                    }))
                  }
                />
                <Field
                  label="Bank name"
                  name="bankName"
                  value={bank.bankName}
                  onChange={(e) =>
                    setBank((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                />
                <Field
                  label="Account name"
                  name="accountName"
                  value={bank.accountName}
                  onChange={(e) =>
                    setBank((prev) => ({
                      ...prev,
                      accountName: e.target.value,
                    }))
                  }
                />
                {errors.bank && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {errors.bank}
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card p-4 sticky bottom-0">
        <div className="min-h-4 min-w-0 flex-1">
          {saveError && (
            <p
              role="alert"
              className="text-xs text-rose-600 dark:text-rose-400"
            >
              {saveError}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} isLoading={saving}>
            Save changes
          </Button>
        </div>
      </footer>
    </form>
  );
}
