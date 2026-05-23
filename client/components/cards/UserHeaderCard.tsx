"use client";
import Image from "next/image";
import { useState } from "react";
import {
  LuUser,
  LuMail,
  LuPhone,
  LuTriangleAlert,
  LuLayoutDashboard,
  LuUserRound,
} from "react-icons/lu";
import { FiSettings } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PhoneField } from "@/components/ui/PhoneField";
import { RoleBadge, LockedBadge } from "@/components/ui";
import { PopulatedUser, Role } from "@/types";
import VerifiedBadge from "@/components/icons/VerifiedBadge";
import { formatPhoneNumber } from "@/lib/formatters";
import { Modal } from "@/components/ui/Modal";
import { imageLoader } from "@/utils/helpers";

interface UserHeaderCardProps {
  user: PopulatedUser;
  variant?: "dashboard" | "profile";
  onUpdate?: (updatedData: any) => Promise<void>;
}

const UserHeaderCard = ({
  user,
  variant = "profile",
  onUpdate,
}: UserHeaderCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isProfileView = variant === "profile";
  const isCompany = user.activeRole === Role.Company;
  const isAgent = user.activeRole === Role.Agent;
  const hasCompany = !!user.companyId && typeof user.companyId !== "string";

  const company = hasCompany ? user.companyId : null;

  const oppositeButton = isProfileView
    ? { label: "View Dashboard", href: "/dashboard", icon: LuLayoutDashboard }
    : { label: "View Profile", href: "/profile", icon: LuUserRound };

  const roleLabel =
    user.activeRole === "agent"
      ? user.agentProfile?.subRole || "Agent"
      : user.activeRole === "company"
        ? user.companyRole || "Company"
        : "";
  const greeting = isProfileView
    ? `Your profile, ${user.name.split(" ")[0]}`
    : `Welcome back, ${roleLabel ? roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1) : ""} ${user.name.split(" ")[0]}!`;

  const variantBadge = isProfileView ? "Profile View" : "Dashboard View";

  // Profile fields
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    user.whatsappNumber || "",
  );
  const [avatar, setAvatar] = useState(user.avatar || "");

  // Agent fields
  const [licenseNumber, setLicenseNumber] = useState(
    user.agentProfile?.licenseNumber || "",
  );
  const [barNumber, setBarNumber] = useState(
    user.agentProfile?.barNumber || "",
  );
  const [surveyorRegNumber, setSurveyorRegNumber] = useState(
    user.agentProfile?.surveyorRegNumber || "",
  );
  const [brokerage, setBrokerage] = useState(
    user.agentProfile?.brokerage || "",
  );

  // Company fields
  const [companyName, setCompanyName] = useState(company?.name || "");
  const [companySlug, setCompanySlug] = useState(company?.slug || "");
  const [companyLogo, setCompanyLogo] = useState(company?.logo || "");
  const [contactEmail, setContactEmail] = useState(company?.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(company?.contactPhone || "");
  const [companyWhatsapp, setCompanyWhatsapp] = useState(
    company?.whatsappNumber || "",
  );
  const [accountNumber, setAccountNumber] = useState(
    company?.remittanceDetails?.accountNumber || "",
  );
  const [bankName, setBankName] = useState(
    company?.remittanceDetails?.bankName || "",
  );
  const [accountName, setAccountName] = useState(
    company?.remittanceDetails?.accountName || "",
  );

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      const updated = {} as any;
      if (isProfileView) {
        updated.name = name;
        updated.phone = phone;
        updated.whatsappNumber = whatsappNumber;
        updated.avatar = avatar;
      } else {
        if (isAgent) {
          updated.agentProfile = {
            ...user.agentProfile,
            licenseNumber,
            barNumber,
            surveyorRegNumber,
            brokerage,
          };
        } else if (isCompany && company) {
          updated.company = {
            name: companyName,
            slug: companySlug,
            logo: companyLogo,
            contactEmail,
            contactPhone,
            whatsappNumber: companyWhatsapp,
            remittanceDetails: {
              accountNumber,
              bankName,
              accountName,
            },
          };
        }
      }
      await onUpdate(updated);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 h-36 md:h-48 rounded-t-2xl rounded-b-none pointer-events-none transition-colors duration-300 ${
          isProfileView
            ? "bg-linear-to-r from-primary/10 via-primary/5 to-transparent"
            : "bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent"
        }`}
      />
      <div className="absolute inset-0 h-36 md:h-48 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent rounded-t-2xl rounded-b-none pointer-events-none" />

      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg relative">
        <div className="relative h-24 md:h-32 bg-muted/20 border-b border-border/50" />

        <div className="relative px-6 pb-6 md:px-8 md:pb-8">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end -mt-8 mb-4">
            <div className="relative flex items-end gap-2">
              <div className="relative h-24 w-24 md:h-28 md:w-28 shrink-0 shadow-xl rounded-full border-4 border-background bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-[1.02]">
                {!imageError && user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                    loader={imageLoader}
                    priority
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <LuUser className="h-12 w-12 text-neutral-400" />
                )}
              </div>
              {!isProfileView && company?.logo && (
                <div className="relative h-12 w-12 rounded-full border-2 border-background bg-white overflow-hidden shadow-md -ml-3 mb-2">
                  <Image
                    src={company.logo}
                    alt={company.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <button
                className="absolute text-base hover:text-primary text-foreground flex items-center justify-center h-8 w-8 bg-background border border-border rounded-full -bottom-1 -right-1 shadow-sm transition-all hover:scale-110 active:scale-95"
                onClick={() => setIsModalOpen(true)}
                aria-label="Edit settings"
              >
                <FiSettings size={14} />
              </button>
            </div>

            <div className="flex flex-1 flex-wrap items-start justify-between gap-4 w-full">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                  {user.name}
                  {user.agentProfile?.verificationStatus === "verified" && (
                    <VerifiedBadge showText={false} />
                  )}
                </h1>
                <p className="text-xs text-muted-foreground -mb-1.5 mt-1">
                  ID:
                  <span className="font-mono bg-inverse px-2 py-1 ml-2 rounded-sm">
                    {user._id}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                {user.roles.map((role: Role) => (
                  <RoleBadge key={role} role={role} />
                ))}
                {isCompany && <LockedBadge />}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-start mb-2">
            <div className="text-base text-muted-foreground">
              <span className="font-bold">{greeting}</span>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider bg-muted/30 px-2 py-0.5 rounded-full text-muted-foreground">
              {variantBadge}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 mt-3 text-sm">
            <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <LuMail className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{user.email}</span>
              {user.isEmailVerified ? (
                <VerifiedBadge showText={false} />
              ) : (
                <LuTriangleAlert
                  className="text-amber-500 shrink-0"
                  title="Email not verified"
                />
              )}
            </div>
            {user.phone && (
              <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <LuPhone className="h-4 w-4 text-primary shrink-0" />
                <span>{formatPhoneNumber(user.phone)}</span>
                {user.isPhoneVerified ? (
                  <VerifiedBadge showText={false} />
                ) : (
                  <LuTriangleAlert
                    className="text-amber-500 shrink-0"
                    title="Phone not verified"
                  />
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-border/60 my-4" />

          <div className="flex flex-wrap justify-between items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              href={oppositeButton.href}
              className="gap-2"
              leftIcon={<oppositeButton.icon className="h-4 w-4" />}
            >
              {oppositeButton.label}
            </Button>

            {user.activeRole === Role.Agent &&
              user.agentProfile?.verificationStatus !== "verified" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 hover:text-amber-700 gap-1"
                  leftIcon={<LuTriangleAlert className="h-4 w-4" />}
                  href="/profile/verification"
                >
                  Verify your profile
                </Button>
              )}
          </div>
        </div>
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isProfileView
              ? "Edit Profile"
              : `Edit ${isAgent ? "Agent" : "Company"} Settings`}
          </h2>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {isProfileView ? (
              <>
                <Field
                  label="Full Name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <PhoneField
                  label="Phone Number"
                  name="phone"
                  value={phone}
                  onChange={setPhone}
                  required={false}
                />
                <PhoneField
                  label="WhatsApp Number"
                  name="whatsapp"
                  value={whatsappNumber}
                  onChange={setWhatsappNumber}
                  required={false}
                />
                <Field
                  label="Avatar URL"
                  name="avatar"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </>
            ) : isAgent ? (
              <>
                <Field
                  label="License Number (Realtors)"
                  name="license"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
                <Field
                  label="Bar Number (Lawyers)"
                  name="bar"
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                />
                <Field
                  label="Surveyor Reg Number"
                  name="surveyor"
                  value={surveyorRegNumber}
                  onChange={(e) => setSurveyorRegNumber(e.target.value)}
                />
                <Field
                  label="Brokerage / Firm"
                  name="brokerage"
                  value={brokerage}
                  onChange={(e) => setBrokerage(e.target.value)}
                />
              </>
            ) : isCompany && company ? (
              <>
                <Field
                  label="Company Name"
                  name="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
                <Field
                  label="Slug"
                  name="companySlug"
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value)}
                  required
                />
                <Field
                  label="Logo URL"
                  name="companyLogo"
                  value={companyLogo}
                  onChange={(e) => setCompanyLogo(e.target.value)}
                />
                <Field
                  label="Contact Email"
                  name="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
                <PhoneField
                  label="Contact Phone"
                  name="contactPhone"
                  value={contactPhone}
                  onChange={setContactPhone}
                  required={false}
                />
                <PhoneField
                  label="WhatsApp Number"
                  name="companyWhatsapp"
                  value={companyWhatsapp}
                  onChange={setCompanyWhatsapp}
                  required={false}
                />
                <div className="border-t pt-3 mt-2">
                  <p className="font-medium mb-2">Remittance Details</p>
                  <div className="space-y-3">
                    <Field
                      label="Account Number"
                      name="accountNumber"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                    <Field
                      label="Bank Name"
                      name="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                    <Field
                      label="Account Name"
                      name="accountName"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserHeaderCard;
