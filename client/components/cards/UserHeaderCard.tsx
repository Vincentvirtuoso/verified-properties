"use client";
import { useCallback, useEffect, useState } from "react";
import { LuMail, LuPhone, LuTriangleAlert, LuUserRound } from "react-icons/lu";
import { FiSettings } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PhoneField } from "@/components/ui/PhoneField";
import { RoleBadge, LockedBadge } from "@/components/ui";
import { PopulatedUser, Role } from "@/types";
import VerifiedBadge from "@/components/icons/VerifiedBadge";
import { formatPhoneNumber } from "@/lib/formatters";
import { Modal } from "@/components/ui/Modal";
import FileUpload from "../ui/FileUpload";
import { Avatar } from "../ui/Avatar";
import { Logomark } from "../ui/LogoMark";
import { useRouter, usePathname } from "next/navigation";

const SETTINGS_HASH = "#settings";

interface UserHeaderCardProps {
  user: PopulatedUser;
  onUpdate?: (updatedData: any) => Promise<void>;
  onProfileOpen: () => void;
}

const UserHeaderCard = ({
  user,
  onProfileOpen,
  onUpdate,
}: UserHeaderCardProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const syncFromHash = () => {
      setIsModalOpen(window.location.hash === SETTINGS_HASH);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const openSettings = useCallback(() => {
    setIsModalOpen(true);
    router.push(`${pathname}${SETTINGS_HASH}`, { scroll: false });
  }, [pathname, router]);

  const closeSettings = useCallback(() => {
    setIsModalOpen(false);
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const isCompany = user.activeRole === Role.Company;
  const isAgent = user.activeRole === Role.Agent;
  const hasCompany = !!user.companyId && typeof user.companyId !== "string";

  const company = hasCompany ? user.companyId : null;

  const roleLabel =
    user.activeRole === "agent"
      ? user.agentProfile?.subRole || "Agent"
      : user.activeRole === "company"
        ? user.companyRole || "Company"
        : "";

  const greeting = `Welcome back, ${roleLabel ? roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1) : ""} ${user.name.split(" ")[0]}!`;

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    user.whatsappNumber || "",
  );
  const [avatar, setAvatar] = useState(user.avatar || "");

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
      updated.name = name;
      updated.phone = phone;
      updated.whatsappNumber = whatsappNumber;
      updated.avatar = avatar;
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
      await onUpdate(updated);
      closeSettings();
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 h-36 md:h-48 rounded-t-2xl rounded-b-none pointer-events-none transition-colors duration-300 bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent"
        `}
      />
      <div className="absolute inset-0 h-36 md:h-48 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent rounded-t-2xl rounded-b-none pointer-events-none" />

      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg relative">
        <div className="relative h-24 md:h-32 bg-muted/20 border-b border-border/50" />

        <div className="relative px-6 pb-6 md:px-8 md:pb-8">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end -mt-8 mb-4">
            <div className="relative flex items-end gap-2">
              <Avatar
                src={user.avatar}
                alt={user.name}
                name={user.name}
                size={90}
                shape="circle"
                className="h-full w-full border-5 border-background"
              />
              {company?.logo && (
                <Avatar
                  src={company.logo}
                  alt={company.name}
                  name={company.name}
                  shape="circle"
                  className="object-cover z-1 border-3 border-card -ml-9"
                  fallbackIcon={<Logomark size={28} />}
                />
              )}
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
                <RoleBadge role={user.activeRole} />
                {isCompany && <LockedBadge company={company!} />}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-start mb-2">
            <div className="text-base text-muted-foreground">
              <span className="font-bold">{greeting}</span>
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
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={onProfileOpen}
                className="gap-2"
                leftIcon={<LuUserRound className="h-4 w-4" />}
              >
                View Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 py-2.5 ml-2"
                aria-label="Settings"
                onClick={openSettings}
              >
                {<FiSettings className="h-4 w-4" />}
              </Button>
            </div>
            {user.activeRole === Role.Agent &&
              user.agentProfile?.verificationStatus !== "verified" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 hover:text-amber-700 gap-1"
                  leftIcon={<LuTriangleAlert className="h-4 w-4" />}
                  href={`/verification?userId=${user._id}`}
                >
                  Verify your profile
                </Button>
              )}
          </div>
        </div>
      </div>

      <Modal open={isModalOpen} onClose={closeSettings}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-1">Edit Profile</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Update your personal details{isAgent ? ", credentials" : ""}
            {isCompany ? ", and company settings" : ""}.
          </p>

          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Personal details
              </h3>
              <FileUpload
                variant="avatar"
                label="Profile photo"
                currentImageUrl={avatar}
                onUploadComplete={(files) => {
                  const file = files[0];
                  if (file) setAvatar(URL.createObjectURL(file));
                }}
              />
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
            </section>

            {isAgent && (
              <section className="space-y-4 pt-6 border-t border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Agent credentials
                </h3>
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
              </section>
            )}

            {isCompany && company && (
              <>
                <section className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Company settings
                  </h3>
                  <FileUpload
                    variant="avatar"
                    label="Company logo"
                    currentImageUrl={companyLogo}
                    onUploadComplete={(files) => {
                      const file = files[0];
                      if (file) setCompanyLogo(URL.createObjectURL(file));
                    }}
                  />
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
                </section>

                <section className="space-y-4 pt-6 border-t border-border">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Remittance details
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used to send your share of closed transactions. Only
                      visible to your team's admins.
                    </p>
                  </div>
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
                </section>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 py-4 border-t border-border sticky bottom-0 bg-card">
            <Button variant="outline" onClick={closeSettings}>
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
