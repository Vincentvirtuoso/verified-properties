"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";
import { Field } from "@affilhomes/shared/ui/Field";
import { useAuth } from "@/contexts/AuthContext";
import {
  Role,
  AgentSubRole,
  agentSubRoleLabels,
  CompanyType,
  companyTypeLabels,
  CompanyRegistrationDraft,
} from "@affilhomes/shared/types";
import {
  FiBriefcase,
  FiHome,
  FiMail,
  FiAward,
  FiBookOpen,
  FiLayers,
} from "react-icons/fi";
import { LuBuilding, LuUser } from "react-icons/lu";
import FileUpload from "@affilhomes/shared/ui/FileUpload";
import { PhoneField } from "@affilhomes/shared/ui/PhoneField";
import { Checkbox } from "@affilhomes/shared/ui/Checkbox";
import Select from "@affilhomes/shared/ui/Select";
import { Centered } from "@affilhomes/shared/ui/Centered";
import { AuthFormSkeleton } from "./FormSkeleton";
import { getErrorMessage } from "@/utils";
import { Button } from "@affilhomes/shared/ui";

const VALID_ROLES = [Role.Agent, Role.Company];

function CompleteRegistrationForm() {
  const {
    user,
    pendingRegistration,
    saveCompanyRegistrationDraft,
    submitCompanyRegistration,
    updateUserRole,
    authLoading,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  let initialRole: Role | null = null;
  if (roleParam === Role.Agent) initialRole = Role.Agent;
  else if (roleParam === Role.Company) initialRole = Role.Company;

  const [submitting, setSubmitting] = useState(false);
  const [agentSubRole, setAgentSubRole] = useState<AgentSubRole>("realtor");
  const [agentData, setAgentData] = useState({
    licenseNumber: "",
    brokerage: "",
    barNumber: "",
    surveyorRegNumber: "",
  });

  const [companyData, setCompanyData] = useState<CompanyRegistrationDraft>({
    companyName: "",
    companyType: "real_estate_company",
    contactEmail: user?.email || "",
    contactPhone: user?.phone || "",
    whatsappNumber: user?.whatsappNumber || user?.phone || "",
    applicantName: user?.name || "",
    applicantPhone: user?.phone || "",
  });

  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [cacCertFile, setCacCertFile] = useState<File | null>(null);

  const [authorised, setAuthorised] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rejected =
    pendingRegistration?.status === "rejected" ? pendingRegistration : null;

  const canReuseCac =
    !!rejected &&
    rejected.rejectionScope !== "cac_document" &&
    !!rejected.cacCertPath;

  const prefilled = useRef(false);

  useEffect(() => {
    if (prefilled.current || pendingRegistration?.status !== "draft") return;
    prefilled.current = true;
    setCompanyData((prev) => ({
      ...prev,
      companyName: pendingRegistration.companyName,
      companyType: pendingRegistration.companyType ?? prev.companyType,
      contactEmail: pendingRegistration.contactEmail || prev.contactEmail,
      contactPhone: pendingRegistration.contactPhone || prev.contactPhone,
      whatsappNumber: pendingRegistration.whatsappNumber || prev.whatsappNumber,
      applicantName: pendingRegistration.applicantName || prev.applicantName,
      applicantPhone: pendingRegistration.applicantPhone || prev.applicantPhone,
    }));
  }, [pendingRegistration]);

  useEffect(() => {
    const status = pendingRegistration?.status;
    if (initialRole !== Role.Company || !user) return;
    if (status === "docs_submitted" || status === "rejected") return;
    if (!companyData.companyName.trim()) return;

    const t = setTimeout(() => {
      saveCompanyRegistrationDraft(companyData).catch((err) =>
        console.error("Draft autosave failed:", err),
      );
    }, 800);
    return () => clearTimeout(t);
  }, [companyData]);

  if (!initialRole || !VALID_ROLES.includes(initialRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Invalid Package
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Please select a valid package: Agent Package or Partnership Package.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading)
    return (
      <AuthFormSkeleton
        variant={initialRole === Role.Company ? "company" : "agent"}
      />
    );

  if (!user) {
    return (
      <Centered className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Please sign in</h2>
        <p className="text-sm text-muted">
          You need an account to complete registration. Sign in or create one to
          continue.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 pt-2 mt-4 sm:items-center">
          <Button
            href={`/login?callbackUrl=${encodeURIComponent(
              window.location.pathname + window.location.search,
            )}`}
            fullWidth
            size="sm"
          >
            Sign in
          </Button>
          <Button size="sm" href="/register" variant="ghost" fullWidth>
            Create account
          </Button>
        </div>
      </Centered>
    );
  }

  useEffect(() => {
    if (user?.activeRole === Role.Company) router.replace("/company/dashboard");
  }, [user?.activeRole, router]);

  if (user?.activeRole === Role.Company) return null;

  if (pendingRegistration?.status === "docs_submitted") {
    return (
      <Centered>
        <div className="w-full p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            Documents under review
          </h2>
          <p className="text-sm text-muted">
            We&apos;re verifying {pendingRegistration.companyName}. This usually
            takes 2 to 5 business days. Your account stays a viewer until
            approval.
          </p>
        </div>
      </Centered>
    );
  }

  const handleAgentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgentData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name])
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name])
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (initialRole === Role.Agent) {
      const newErrors: Record<string, string> = {};
      if (agentSubRole === "realtor" && !agentData.licenseNumber.trim())
        newErrors.licenseNumber = "License number is required for Realtors";
      if (agentSubRole === "lawyer" && !agentData.barNumber.trim())
        newErrors.barNumber =
          "Supreme Court Bar number is required for Lawyers";
      if (agentSubRole === "surveyor" && !agentData.surveyorRegNumber.trim())
        newErrors.surveyorRegNumber =
          "SURCON registration number is required for Surveyors";
      if (Object.keys(newErrors).length) return setErrors(newErrors);

      setSubmitting(true);
      try {
        await updateUserRole(user._id, {
          roles: Array.from(new Set([...user.roles, Role.Agent])),
          activeRole: Role.Agent,
          agentProfile: {
            subRole: agentSubRole,
            verificationStatus: "unverified",
            activeListings: 0,
            activeBoostedListings: 0,
            licenseNumber:
              agentSubRole === "realtor"
                ? agentData.licenseNumber.trim()
                : undefined,
            brokerage:
              agentSubRole === "realtor" && agentData.brokerage.trim()
                ? agentData.brokerage.trim()
                : undefined,
            barNumber:
              agentSubRole === "lawyer"
                ? agentData.barNumber.trim()
                : undefined,
            surveyorRegNumber:
              agentSubRole === "surveyor"
                ? agentData.surveyorRegNumber.trim()
                : undefined,
          },
        });
        router.push("/welcome");
      } catch (err) {
        setErrors({
          submit: getErrorMessage(
            err,
            "Could not save your profile. Please retry.",
          ),
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!companyData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!companyData.contactEmail.trim())
      newErrors.contactEmail = "Contact email is required";
    if (!companyData.applicantName.trim())
      newErrors.applicantName = "Your full name is required";
    if (!cacCertFile && !canReuseCac)
    newErrors.cacCert =
      "CAC certificate is required for partnership registration";
    if (!authorised)
      newErrors.authorised =
        "You must confirm you are authorised to act for this company";

    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setSubmitting(true);
    try {
      await saveCompanyRegistrationDraft(companyData);
      await submitCompanyRegistration({
        cacCertificate: cacCertFile,
        logo: companyLogoFile,
        authorised,
      });
    } catch (err) {
      setErrors({
        submit: getErrorMessage(err, "Could not submit. Please retry."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthForm
      title={
        initialRole === Role.Agent
          ? "Agent Package Setup"
          : "Partnership Registration"
      }
      subtitle={
        initialRole === Role.Agent
          ? "Tell us your professional capacity to complete your profile"
          : "Submit your company details for partnership registration"
      }
      onSubmit={handleSubmit}
      submitText="Complete Registration"
      footerText=""
      footerLinkText=""
      footerHref=""
      showSocialLogins={false}
      className="max-w-xl"
      loading={submitting || authLoading}
    >
      {initialRole === Role.Agent && (
        <div className="space-y-4">
          <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
            <h3 className="font-semibold text-violet-900 dark:text-violet-200 text-sm">
              Agent Package — Standard Tier
            </h3>
            <p className="text-xs text-violet-700 dark:text-violet-300 mt-1">
              Free to join. List properties and boost visibility for ₦1,000 per
              property per month. Select your professional capacity below.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FiLayers className="text-gray-400" /> Professional Capacity
            </label>
            <select
              value={agentSubRole}
              onChange={(e) => setAgentSubRole(e.target.value as AgentSubRole)}
              className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
            >
              {Object.entries(agentSubRoleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {agentSubRole === "realtor" && (
            <div className="space-y-4 pt-2">
              <Field
                label="License Number"
                name="licenseNumber"
                type="text"
                placeholder="e.g. AG-12345"
                value={agentData.licenseNumber}
                onChange={handleAgentChange}
                error={errors.licenseNumber}
                icon={FiBriefcase}
                required
              />
              <Field
                label="Brokerage / Agency Affiliation (Optional)"
                name="brokerage"
                type="text"
                placeholder="e.g. Prime Properties"
                value={agentData.brokerage}
                onChange={handleAgentChange}
                icon={FiHome}
              />
            </div>
          )}

          {agentSubRole === "lawyer" && (
            <div className="space-y-4 pt-2">
              <Field
                label="Supreme Court Bar Number"
                name="barNumber"
                type="text"
                placeholder="e.g. SCN/2016/432"
                value={agentData.barNumber}
                onChange={handleAgentChange}
                error={errors.barNumber}
                icon={FiBookOpen}
                required
              />
            </div>
          )}

          {agentSubRole === "surveyor" && (
            <div className="space-y-4 pt-2">
              <Field
                label="SURCON Registration Number"
                name="surveyorRegNumber"
                type="text"
                placeholder="e.g. SURV-54321"
                value={agentData.surveyorRegNumber}
                onChange={handleAgentChange}
                error={errors.surveyorRegNumber}
                icon={FiAward}
                required
              />
            </div>
          )}

          {(agentSubRole === "landlord" || agentSubRole === "other") && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              No professional license is required for{" "}
              <strong>{agentSubRoleLabels[agentSubRole]}s</strong>. You can
              complete standard identification checks from your dashboard after
              registration.
            </div>
          )}
        </div>
      )}

      {initialRole === Role.Company && (
        <div className="space-y-4">
          {pendingRegistration?.status === "rejected" && (
            <div
              role="alert"
              className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl p-4 space-y-1"
            >
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Your last application wasn&apos;t approved
              </p>
              {pendingRegistration.rejectionReason && (
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  {pendingRegistration.rejectionReason}
                </p>
              )}
              <p className="text-xs text-rose-800 dark:text-rose-300">
                {canReuseCac
                  ? "Correct the details below and resubmit. Your current CAC certificate will be reused."
                  : "Upload a CAC certificate below, then resubmit."}
              </p>
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
              Partnership Package — Featured Tier
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              For CAC-registered entities only. Your listings will be ranked in
              the top positions across all search results. A 10% remittance
              applies on every closed deal.
            </p>
          </div>

          <FileUpload
            variant="avatar"
            label="Company Logo (Optional)"
            description="High-resolution square asset, min 200×200px. PNG, JPG or WEBP."
            maxSizeInMB={2}
            maxFiles={1}
            allowedTypes={["image/jpeg", "image/png", "image/webp"]}
            onUploadComplete={(files) => setCompanyLogoFile(files[0] || null)}
            className="mb-2"
          />

          {canReuseCac && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted">
              Your current CAC certificate will be used. Upload a new one only
              if you need to replace it.
            </div>
          )}

          <FileUpload
            variant="document"
            label={
              canReuseCac
                ? "Replacement CAC certificate (optional)"
                : "CAC Certificate *"
            }
            description="Upload your Corporate Affairs Commission certificate. PDF, JPG or PNG."
            maxSizeInMB={5}
            maxFiles={1}
            allowedTypes={["application/pdf", "image/jpeg", "image/png"]}
            onUploadComplete={(files) => {
              setCacCertFile(files[0] || null);
              if (errors.cacCert)
                setErrors((prev) => ({ ...prev, cacCert: "" }));
            }}
            className="mb-2"
          />
          {errors.cacCert && (
            <p className="text-red-500 text-xs -mt-1">{errors.cacCert}</p>
          )}

          <Field
            label="Registered Company Name"
            name="companyName"
            type="text"
            placeholder="AFFILHOMES Development Partners Ltd."
            value={companyData.companyName}
            onChange={handleCompanyChange}
            error={errors.companyName}
            icon={LuBuilding}
            required
          />
          <p className="-mt-2 text-xs text-muted">
            Enter the name exactly as it appears on your CAC certificate. It
            can&apos;t be changed after approval, because it is checked against
            that certificate.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              onChange={(value) =>
                setCompanyData((prev) => ({
                  ...prev,
                  companyType: value as CompanyType,
                }))
              }
              value={companyData.companyType as CompanyType}
              label="Company Type"
              options={Object.entries(companyTypeLabels).map(
                ([value, label]) => ({ label, value }),
              )}
            />

            <Field
              label="Corporate Contact Email"
              name="contactEmail"
              type="email"
              placeholder="info@company.com"
              value={companyData.contactEmail}
              onChange={handleCompanyChange}
              error={errors.contactEmail}
              icon={FiMail}
              required
            />
          </div>

          <PhoneField
            label="Primary Contact Line"
            name="contactPhone"
            value={companyData.contactPhone}
            onChange={(value) =>
              setCompanyData((prev) => ({ ...prev, contactPhone: value }))
            }
          />

          <PhoneField
            label="WhatsApp Support Line"
            name="whatsappNumber"
            value={companyData.whatsappNumber}
            onChange={(value) =>
              setCompanyData((prev) => ({ ...prev, whatsappNumber: value }))
            }
          />

          <div className="space-y-4 rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-foreground">
              Your details
            </p>
            <p className="text-xs text-muted">
              Tell us who is making this application.
            </p>

            <Field
              label="Your full name"
              name="applicantName"
              type="text"
              value={companyData.applicantName}
              onChange={handleCompanyChange}
              error={errors.applicantName}
              icon={LuUser}
              required
            />

            <PhoneField
              label="Your phone number"
              name="applicantPhone"
              value={companyData.applicantPhone}
              onChange={(value) =>
                setCompanyData((prev) => ({ ...prev, applicantPhone: value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Checkbox
              name="authorised"
              checked={authorised}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAuthorised(e.target.checked);
                if (errors.authorised)
                  setErrors((prev) => ({ ...prev, authorised: "" }));
              }}
              label={
                <span className="text-sm leading-relaxed text-gray-600">
                  I confirm I am authorised to act for this company, and I
                  understand the registered company name can&apos;t be changed
                  after approval.
                </span>
              }
              error={errors.authorised}
            />
          </div>
        </div>
      )}

      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.submit}
          </p>
        </div>
      )}
    </AuthForm>
  );
}

export default function CompleteRegistration() {
  return (
    <Suspense fallback={<AuthFormSkeleton variant="agent" />}>
      <CompleteRegistrationForm />
    </Suspense>
  );
}
