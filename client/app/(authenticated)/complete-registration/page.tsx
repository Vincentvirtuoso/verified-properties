"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthForm } from "@/components/forms/AuthForm";
import { Field } from "@/components/ui/Field";
import { useAuth } from "@/contexts/AuthContext";
import { Role, PopulatedUser, Company, CompanyType } from "@/types";
import {
  FiBriefcase,
  FiCreditCard,
  FiHome,
  FiGrid,
  FiUser,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import { LuBuilding } from "react-icons/lu";

const VALID_ROLES = [Role.Agent, Role.Landlord, Role.Company, Role.Developer];

export default function CompleteRegistration() {
  const { user, completeRegistration, authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const role = roleParam ? (roleParam as Role) : null;
  const [agentData, setAgentData] = useState({
    licenseNumber: "",
    brokerage: "",
  });

  const [landlordData, setLandlordData] = useState({
    accountNumber: "",
    bankName: "",
    accountName: "",
  });

  const [companyData, setCompanyData] = useState({
    companyName: "",
    companyType: "real_estate_company" as CompanyType,
    contactEmail: user?.email,
    contactPhone: user?.phone || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!role || !VALID_ROLES.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Role</h2>
          <p className="text-gray-600">
            This onboarding page requires a valid role (agent, landlord,
            company, developer).
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading user...</p>
      </div>
    );
  }

  const handleAgentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgentData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name])
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleLandlordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLandlordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name])
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleCompanyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setCompanyData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name])
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (role === Role.Agent) {
      if (!agentData.licenseNumber.trim())
        newErrors.licenseNumber = "License number is required";
    }
    if (role === Role.Landlord) {
      if (!landlordData.accountNumber.trim())
        newErrors.accountNumber = "Account number is required";
      if (!landlordData.bankName.trim())
        newErrors.bankName = "Bank name is required";
      if (!landlordData.accountName.trim())
        newErrors.accountName = "Account name is required";
    }
    if (role === Role.Company || role === Role.Developer) {
      if (!companyData.companyName.trim())
        newErrors.companyName = "Company name is required";
      if (!companyData?.contactEmail?.trim())
        newErrors.contactEmail = "Contact email is required";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const updates: Partial<PopulatedUser> = {};
    let company: Company | undefined;

    if (role === Role.Agent) {
      updates.agentProfile = {
        licenseNumber: agentData.licenseNumber.trim(),
        brokerage: agentData.brokerage.trim() || undefined,
        verificationStatus: "unverified",
        activeListings: 0,
        activeBoostedListings: 0,
      };
    }

    if (role === Role.Landlord) {
      updates.landlordProfile = {
        verificationStatus: "unverified",
        activeListings: 0,
        remittanceDetails: {
          accountNumber: landlordData.accountNumber.trim(),
          bankName: landlordData.bankName.trim(),
          accountName: landlordData.accountName.trim(),
        },
        totalRemitted: 0,
      };
    }

    if (role === Role.Company || role === Role.Developer) {
      const companyId = `comp_${Date.now()}`;
      company = {
        _id: companyId,
        name: companyData.companyName.trim(),
        slug: companyData.companyName.toLowerCase().replace(/\s+/g, "-"),
        logo: undefined,
        type: companyData.companyType,
        verificationStatus: "unverified",
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
        contactEmail: companyData?.contactEmail?.trim() || "",
        contactPhone: companyData.contactPhone.trim() || undefined,
        activeListings: 0,
        totalRemitted: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    try {
      await completeRegistration(user._id, updates, company);

      if (role === Role.Agent || role === Role.Landlord) {
        router.push("/onboarding/become-an-agent-or-landlord");
      } else {
        router.push("/onboarding/company");
      }
    } catch (error) {
      console.error("Failed to complete registration", error);
      setErrors({ submit: "Something went wrong. Please try again." });
    }
  };

  const title =
    role === Role.Agent
      ? "Agent Details"
      : role === Role.Landlord
        ? "Landlord Details"
        : "Company Details";

  const subtitle = "Just a few more details to set up your account correctly.";

  return (
    <AuthForm
      title={title}
      subtitle={subtitle}
      onSubmit={handleSubmit}
      submitText="Continue"
      footerText=""
      footerLinkText=""
      footerHref=""
      showSocialLogins={false}
      className="max-w-xl"
      loading={authLoading}
    >
      {role === Role.Agent && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">
              Professional Information
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              This helps build trust with clients.
            </p>
          </div>
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
            label="Brokerage / Agency (optional)"
            name="brokerage"
            type="text"
            placeholder="e.g. Prime Properties"
            value={agentData.brokerage}
            onChange={handleAgentChange}
            icon={FiHome}
          />
        </div>
      )}

      {role === Role.Landlord && (
        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm">
              Bank Details for Payouts
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              We’ll send rent/sale proceeds to this account.
            </p>
          </div>
          <Field
            label="Account Number"
            name="accountNumber"
            type="text"
            placeholder="1234567890"
            value={landlordData.accountNumber}
            onChange={handleLandlordChange}
            error={errors.accountNumber}
            icon={FiCreditCard}
            required
          />
          <Field
            label="Bank Name"
            name="bankName"
            type="text"
            placeholder="e.g. First Bank"
            value={landlordData.bankName}
            onChange={handleLandlordChange}
            error={errors.bankName}
            icon={FiGrid}
            required
          />
          <Field
            label="Account Name"
            name="accountName"
            type="text"
            placeholder="John Doe"
            value={landlordData.accountName}
            onChange={handleLandlordChange}
            error={errors.accountName}
            icon={FiUser}
            required
          />
        </div>
      )}

      {(role === Role.Company || role === Role.Developer) && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
              Company Information
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              This will be displayed on your listings and profile.
            </p>
          </div>
          <Field
            label="Company Name"
            name="companyName"
            type="text"
            placeholder="Acme Real Estate Ltd."
            value={companyData.companyName}
            onChange={handleCompanyChange}
            error={errors.companyName}
            icon={LuBuilding}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Company Type</label>
              <select
                name="companyType"
                value={companyData.companyType}
                onChange={handleCompanyChange}
                className="border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-900"
              >
                <option value="real_estate_company">Real Estate Company</option>
                <option value="developer">Developer</option>
              </select>
            </div>
            <Field
              label="Contact Email"
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
          <Field
            label="Contact Phone"
            name="contactPhone"
            type="tel"
            placeholder="+2348012345678"
            value={companyData.contactPhone}
            onChange={handleCompanyChange}
            icon={FiPhone}
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
