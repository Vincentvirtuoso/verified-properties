"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";
import { Field } from "@/components/ui/Field";
import { useAuth } from "@/contexts/AuthContext";
import { Role, AgentProfile, LandlordProfile, PopulatedUser } from "@/types";
import { FiBriefcase, FiCreditCard, FiHome, FiUser } from "react-icons/fi";
import { PageSpinner } from "@/components/ui/Spinner";
import { AiFillBank } from "react-icons/ai";

const ALLOWED_TRANSITIONS: Record<string, Role[]> = {
  [Role.Viewer]: [Role.Agent, Role.Landlord],
  [Role.Agent]: [Role.Viewer, Role.Landlord],
  [Role.Landlord]: [Role.Viewer, Role.Agent],
};

function AddRoleFormContent() {
  const { user, updateUserRole, authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRole = searchParams.get("from") as Role | null;
  const toRole = searchParams.get("to") as Role | null;

  const isValidTransition =
    fromRole &&
    toRole &&
    ALLOWED_TRANSITIONS[fromRole]?.includes(toRole) &&
    user?.roles.includes(fromRole);

  const [agentData, setAgentData] = useState({
    licenseNumber: "",
    brokerage: "",
  });
  const [landlordData, setLandlordData] = useState({
    accountNumber: "",
    bankName: "",
    accountName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAgentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgentData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLandlordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLandlordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!isValidTransition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Invalid Request
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This role upgrade is not allowed. You can only upgrade from a Viewer
            to an Agent or Landlord.
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

    if (toRole === Role.Agent) {
      if (!agentData.licenseNumber.trim())
        newErrors.licenseNumber = "License number is required";
    }
    if (toRole === Role.Landlord) {
      if (!landlordData.accountNumber.trim())
        newErrors.accountNumber = "Account number is required";
      if (!landlordData.bankName.trim())
        newErrors.bankName = "Bank name is required";
      if (!landlordData.accountName.trim())
        newErrors.accountName = "Account name is required";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const updatedProfile: Partial<PopulatedUser> = {
      roles: [...user!.roles, toRole],
      activeRole: toRole,
    };

    if (toRole === Role.Agent) {
      updatedProfile.agentProfile = {
        licenseNumber: agentData.licenseNumber.trim(),
        brokerage: agentData.brokerage.trim() || undefined,
        verificationStatus: "unverified",
        activeListings: 0,
        activeBoostedListings: 0,
      } as AgentProfile;
    }

    if (toRole === Role.Landlord) {
      updatedProfile.landlordProfile = {
        verificationStatus: "unverified",
        activeListings: 0,
        remittanceDetails: {
          accountNumber: landlordData.accountNumber.trim(),
          bankName: landlordData.bankName.trim(),
          accountName: landlordData.accountName.trim(),
        },
        totalRemitted: 0,
      } as LandlordProfile;
    }

    try {
      await updateUserRole(user!._id, updatedProfile);
      router.push("/welcome");
    } catch (error) {
      console.error("Role upgrade failed", error);
    }
  };

  return (
    <AuthForm
      title={`Become a${toRole === Role.Agent ? "n Agent" : " Landlord"}`}
      subtitle={`Complete the details below to upgrade your account from ${
        fromRole === Role.Viewer ? "Seeker" : fromRole
      } to ${toRole}.`}
      onSubmit={handleSubmit}
      submitText="Upgrade Account"
      footerText=""
      footerLinkText=""
      footerHref=""
      showSocialLogins={false}
      className="max-w-xl"
      loading={authLoading}
    >
      {toRole === Role.Agent && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted">
            Agent Details <span className="text-red-500">*</span>
          </h3>
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

      {toRole === Role.Landlord && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted">
            Payout Details (for rent/sale proceeds)
          </h3>
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
            icon={AiFillBank}
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
