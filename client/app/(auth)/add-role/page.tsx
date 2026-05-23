"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";
import { Field } from "@/components/ui/Field";
import { useAuth } from "@/contexts/AuthContext";
import {
  Role,
  AgentSubRole,
  agentSubRoleLabels,
  PopulatedUser,
} from "@/types/user";
import {
  FiBriefcase,
  FiHome,
  FiAward,
  FiBookOpen,
  FiLayers,
} from "react-icons/fi";
import { PageSpinner } from "@/components/ui/Spinner";

const ALLOWED_TRANSITIONS: Record<Role, Role[]> = {
  [Role.Viewer]: [Role.Agent],
  [Role.Agent]: [],
  [Role.Company]: [],
};

function AddRoleFormContent() {
  const { user, updateUserRole, authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromRole = (searchParams.get("from") as Role) || Role.Viewer;
  const toRole = (searchParams.get("to") as Role) || Role.Agent;

  const isValidTransition =
    fromRole &&
    toRole &&
    ALLOWED_TRANSITIONS[fromRole]?.includes(toRole) &&
    user?.roles.includes(fromRole) &&
    !user?.roles.includes(Role.Company);

  const [subRole, setSubRole] = useState<AgentSubRole>("realtor");
  const [formData, setFormData] = useState({
    licenseNumber: "",
    brokerage: "",
    barNumber: "",
    surveyorRegNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!isValidTransition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Invalid Request
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This role upgrade is not permitted or your account is already locked
            into a custom tier.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-6 text-violet-600 hover:underline font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (subRole === "realtor") {
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = "License number is required for Realtors";
      }
    } else if (subRole === "lawyer") {
      if (!formData.barNumber.trim()) {
        newErrors.barNumber = "Bar number is required for Lawyers";
      }
    } else if (subRole === "surveyor") {
      if (!formData.surveyorRegNumber.trim()) {
        newErrors.surveyorRegNumber =
          "Surveyor registration number is required";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const updatedRoles = Array.from(new Set([...user!.roles, Role.Agent]));

    const updatedProfile: Partial<PopulatedUser> = {
      roles: updatedRoles,
      activeRole: Role.Agent,
      agentProfile: {
        subRole,
        verificationStatus: "unverified",
        activeListings: 0,
        activeBoostedListings: 0,

        licenseNumber:
          subRole === "realtor" ? formData.licenseNumber.trim() : undefined,
        brokerage:
          subRole === "realtor" && formData.brokerage.trim()
            ? formData.brokerage.trim()
            : undefined,
        barNumber: subRole === "lawyer" ? formData.barNumber.trim() : undefined,
        surveyorRegNumber:
          subRole === "surveyor"
            ? formData.surveyorRegNumber.trim()
            : undefined,
      },
    };

    try {
      await updateUserRole(user!._id, updatedProfile);
      router.push("/welcome");
    } catch (error) {
      console.error("Agent package onboarding failed:", error);
    }
  };

  return (
    <AuthForm
      title="Activate Agent Package"
      subtitle="Select your professional path and provide credentials to start listing properties."
      onSubmit={handleSubmit}
      submitText="Complete Setup"
      footerText=""
      footerLinkText=""
      footerHref=""
      showSocialLogins={false}
      className="max-w-xl"
      loading={authLoading}
    >
      <div className="space-y-5">
        {/* Sub-Role Picker dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <FiLayers className="text-gray-400" /> Professional Category
          </label>
          <select
            name="subRole"
            value={subRole}
            onChange={(e) => setSubRole(e.target.value as AgentSubRole)}
            className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
          >
            {Object.entries(agentSubRoleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-gray-100 dark:border-neutral-800 my-2" />

        {/* Conditional Field Render Strategy */}
        {subRole === "realtor" && (
          <div className="space-y-4">
            <Field
              label="License Number"
              name="licenseNumber"
              type="text"
              placeholder="e.g. RE-12345"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              error={errors.licenseNumber}
              icon={FiBriefcase}
              required
            />
            <Field
              label="Brokerage / Agency Affiliation (Optional)"
              name="brokerage"
              type="text"
              placeholder="e.g. Prime Properties Ltd"
              value={formData.brokerage}
              onChange={handleInputChange}
              icon={FiHome}
            />
          </div>
        )}

        {subRole === "lawyer" && (
          <div className="space-y-4">
            <Field
              label="Supreme Court Bar Number"
              name="barNumber"
              type="text"
              placeholder="e.g. SCN/2014/123"
              value={formData.barNumber}
              onChange={handleInputChange}
              error={errors.barNumber}
              icon={FiBookOpen}
              required
            />
          </div>
        )}

        {subRole === "surveyor" && (
          <div className="space-y-4">
            <Field
              label="SURCON Registration Number"
              name="surveyorRegNumber"
              type="text"
              placeholder="e.g. SURV-9876"
              value={formData.surveyorRegNumber}
              onChange={handleInputChange}
              error={errors.surveyorRegNumber}
              icon={FiAward}
              required
            />
          </div>
        )}

        {(subRole === "landlord" || subRole === "other") && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            As a <strong>{agentSubRoleLabels[subRole]}</strong>, no specialized
            professional regulatory credentials are required up front. You will
            be able to manage and upload your custom verification documents on
            the next step.
          </div>
        )}
      </div>
    </AuthForm>
  );
}

export default function AddRolePage() {
  return (
    <Suspense fallback={<PageSpinner label="Loading upgrade options..." />}>
      <AddRoleFormContent />
    </Suspense>
  );
}
