"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthForm } from "@/components/forms/AuthForm";
import { Field } from "@/components/ui/Field";
import { useAuth } from "@/contexts/AuthContext";
import {
  Role,
  PopulatedUser,
  Company,
  AgentSubRole,
  agentSubRoleLabels,
  CompanyType,
} from "@/types";
import {
  FiBriefcase,
  FiHome,
  FiMail,
  FiAward,
  FiBookOpen,
  FiLayers,
} from "react-icons/fi";
import { LuBuilding } from "react-icons/lu";
import FileUpload from "@/components/ui/FileUpload";
import { PhoneField } from "@/components/ui/PhoneField";

const VALID_ROLES = [Role.Agent, Role.Company];

function CompleteRegistrationForm() {
  const { user, completeRegistration, authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  // Derive initial role strictly from the two valid packages
  // Any other value (old landlord/developer routes) is treated as invalid
  let initialRole: Role | null = null;
  if (roleParam === Role.Agent) initialRole = Role.Agent;
  else if (roleParam === Role.Company) initialRole = Role.Company;

  const [agentSubRole, setAgentSubRole] = useState<AgentSubRole>("realtor");

  const [agentData, setAgentData] = useState({
    licenseNumber: "",
    brokerage: "",
    barNumber: "",
    surveyorRegNumber: "",
  });

  const [companyData, setCompanyData] = useState<{
    companyName: string;
    companyType: CompanyType;
    contactEmail: string;
    contactPhone: string;
    whatsappNumber: string;
  }>({
    companyName: "",
    companyType: "real_estate_company",
    contactEmail: user?.email || "",
    contactPhone: user?.phone || "",
    whatsappNumber: user?.whatsappNumber || user?.phone || "",
  });

  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [cacCertFile, setCacCertFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!initialRole || !VALID_ROLES.includes(initialRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Invalid Package
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Please select a valid package — Agent Package or Partnership
            Package.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <p className="text-gray-500 animate-pulse text-sm">
          Loading user context...
        </p>
      </div>
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
    const newErrors: Record<string, string> = {};

    if (initialRole === Role.Agent) {
      if (agentSubRole === "realtor" && !agentData.licenseNumber.trim())
        newErrors.licenseNumber = "License number is required for Realtors";
      if (agentSubRole === "lawyer" && !agentData.barNumber.trim())
        newErrors.barNumber =
          "Supreme Court Bar number is required for Lawyers";
      if (agentSubRole === "surveyor" && !agentData.surveyorRegNumber.trim())
        newErrors.surveyorRegNumber =
          "SURCON registration number is required for Surveyors";
    }

    if (initialRole === Role.Company) {
      if (!companyData.companyName.trim())
        newErrors.companyName = "Company name is required";
      if (!companyData.contactEmail.trim())
        newErrors.contactEmail = "Contact email is required";
      if (!cacCertFile)
        newErrors.cacCert =
          "CAC certificate is required for partnership registration";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const updates: Partial<PopulatedUser> = {
      roles: Array.from(new Set([...user.roles, initialRole])),
      activeRole: initialRole,
    };

    let companyPayload: Company | undefined;

    if (initialRole === Role.Agent) {
      updates.agentProfile = {
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
          agentSubRole === "lawyer" ? agentData.barNumber.trim() : undefined,
        surveyorRegNumber:
          agentSubRole === "surveyor"
            ? agentData.surveyorRegNumber.trim()
            : undefined,
      };
    }

    if (initialRole === Role.Company) {
      const companyId = `comp_${Date.now()}`;
      updates.companyRole = "admin";

      companyPayload = {
        _id: companyId,
        name: companyData.companyName.trim(),
        slug: companyData.companyName.toLowerCase().replace(/\s+/g, "-"),
        // Logo and CAC files are uploaded by completeRegistration().
        logo: undefined,
        type: companyData.companyType,
        verificationStatus: "unverified",
        // CAC certificate and logo stored in onboardingDocs
        // Reviewed by admin before verificationStatus moves to "verified"
        onboardingDocs: {
          cacCertificateUrl: "",
        },
        features: {
          whatsappNotifications: false,
          prioritySupport: false,
          dedicatedAccountManager: false,
          whiteLabel: false,
        },
        team: [
          {
            userId: user._id,
            role: "admin",
            permissions: [
              "manage_listings",
              "manage_members",
              "view_analytics",
            ],
          },
        ],
        contactEmail: companyData.contactEmail.trim(),
        contactPhone: companyData.contactPhone.trim() || undefined,
        whatsappNumber: companyData.whatsappNumber.trim() || undefined,
        activeListings: 0,
        totalRemitted: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Company;
    }

    try {
      await completeRegistration(user._id, updates, companyPayload, {
        logo: companyLogoFile,
        cacCertificate: cacCertFile,
      });
      router.push("/welcome");
    } catch (error) {
      console.error("Onboarding error:", error);
      setErrors({
        submit:
          error instanceof Error && error.message
            ? error.message
            : "An error occurred while saving your profile. Please retry.",
      });
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
      loading={authLoading}
    >
      {/* ── AGENT PACKAGE ── */}
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

      {/* ── PARTNERSHIP PACKAGE ── */}
      {initialRole === Role.Company && (
        <div className="space-y-4">
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

          <FileUpload
            variant="document"
            label="CAC Certificate *"
            description="Upload your Corporate Affairs Commission certificate. PDF, JPG or PNG."
            maxSizeInMB={5}
            maxFiles={1}
            allowedTypes={["application/pdf", "image/jpeg", "image/png"]}
            onUploadComplete={(files) => {
              console.log(files);
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
            placeholder="Acme Development Partners Ltd."
            value={companyData.companyName}
            onChange={handleCompanyChange}
            error={errors.companyName}
            icon={LuBuilding}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Type
              </label>
              <select
                value={companyData.companyType}
                onChange={(e) =>
                  setCompanyData((prev) => ({
                    ...prev,
                    companyType: e.target.value as CompanyType,
                  }))
                }
                className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              >
                <option value="real_estate_company">Real Estate Company</option>
                <option value="developer">Property Developer</option>
                <option value="broker">Real Estate Brokerage</option>
              </select>
            </div>

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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
          <div className="text-gray-500 dark:text-gray-400 animate-pulse text-sm">
            Loading registration modules...
          </div>
        </div>
      }
    >
      <CompleteRegistrationForm />
    </Suspense>
  );
}
