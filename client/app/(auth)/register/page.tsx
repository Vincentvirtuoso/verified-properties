"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RadioGroup } from "@affilhomes/shared/ui/RadioGroup";
import { Field } from "@affilhomes/shared/ui/Field";
import { AuthForm } from "@/components/forms/AuthForm";
import { PhoneField } from "@affilhomes/shared/ui/PhoneField";
import { Checkbox } from "@affilhomes/shared/ui/Checkbox";
import { PageSpinner } from "@affilhomes/shared/ui/Spinner";
import { Role, PopulatedUser } from "@affilhomes/shared/types";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";

const ACCOUNT_TYPES = ["seeker", "agent", "company"] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number];

const ACCOUNT_OPTIONS = [
  {
    value: "seeker",
    label: "Seeker Account",
    description: "For those browsing and searching for properties",
  },
  {
    value: "agent",
    label: "Agent Package",
    description:
      "For realtors, lawyers, surveyors, landlords and individual listers. Free to join.",
  },
  {
    value: "company",
    label: "Partnership Package",
    description:
      "For CAC-registered real estate firms, developers and brokerages. Requires document review.",
  },
];

const NEXT_BY_ACCOUNT_TYPE: Record<AccountType, string> = {
  seeker: "/",
  agent: "/complete-registration?role=agent",
  company: "/complete-registration?role=company",
};

interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  repeatPassword: string;
  agreeToTerms: boolean;
}

const INITIAL_FORM: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  password: "",
  repeatPassword: "",
  agreeToTerms: false,
};

function isAccountType(value: string | null): value is AccountType {
  return !!value && (ACCOUNT_TYPES as readonly string[]).includes(value);
}

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";

  if (!form.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Please enter a valid email";

  const digits = form.phone.replace(/\D/g, "");
  if (!digits) errors.phone = "Phone number is required";
  else if (digits.length < 10 || digits.length > 13)
    errors.phone = "Please enter a valid phone number";

  if (!form.password) errors.password = "Password is required";
  else if (form.password.length < 8)
    errors.password = "Password must be at least 8 characters";

  if (form.password !== form.repeatPassword)
    errors.repeatPassword = "Passwords do not match";

  if (!form.agreeToTerms)
    errors.agreeToTerms = "You must agree to the Terms & Conditions";

  return errors;
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists"))
    return "An account with this email already exists. Sign in instead.";
  if (m.includes("password"))
    return "That password doesn't meet the requirements. Try a longer or different one.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Wait a minute and try again.";
  return "We couldn't create your account. Please try again.";
}

function buildSignupUser(form: FormState): PopulatedUser {
  const now = new Date();
  const phone = form.phone.trim();
  return {
    _id: "",
    email: form.email.trim(),
    phone,
    whatsappNumber: phone,
    passwordHash: "",
    name: `${form.firstName.trim()} ${form.lastName.trim()}`,
    isEmailVerified: false,
    isPhoneVerified: false,
    roles: [Role.Viewer],
    activeRole: Role.Viewer,
    viewerProfile: { savedListingIds: [] },
    createdAt: now,
    updatedAt: now,
  } as PopulatedUser;
}

function RegisterForm() {
  const { register, authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const accountParam = searchParams.get("accountType");
  const [accountType, setAccountType] = useState<AccountType>(
    isAccountType(accountParam) ? accountParam : "seeker",
  );
  const [showInvalidAccountNotice, setShowInvalidAccountNotice] = useState(
    !!accountParam && !isAccountType(accountParam),
  );
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof FormState>(
    name: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as Exclude<keyof FormState, "agreeToTerms">;
    setField(name, e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");

    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const next = NEXT_BY_ACCOUNT_TYPE[accountType];

    setSubmitting(true);
    try {
      const signedIn = await register(
        buildSignupUser(form),
        form.password,
        undefined,
        { next, accountType },
      );

      if (!signedIn) {
        setNotice(
          "Account created. Check your email and click the confirmation link to continue.",
        );
        return;
      }

      router.replace(next);
    } catch (err) {
      setErrors({
        submit: friendlyAuthError(err instanceof Error ? err.message : ""),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthForm
      title="Create Account"
      subtitle="Join Nigeria's leading real estate platform"
      onSubmit={handleSubmit}
      submitText="Create Account"
      footerText="Already have an account?"
      footerLinkText="Sign In"
      footerHref="/login"
      showSocialLogins={false}
      className="max-w-3xl"
      loading={submitting || authLoading}
    >
      {showInvalidAccountNotice && (
        <div
          role="status"
          className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3"
        >
          <p className="text-sm text-amber-800 dark:text-amber-300">
            The account type in this link isn't recognized, so we've selected
            Seeker Account. Choose the option that fits you below.
          </p>
        </div>
      )}
      <RadioGroup
        label="Account Type"
        name="accountType"
        options={ACCOUNT_OPTIONS}
        value={accountType}
        onChange={(value: string) => {
          if (isAccountType(value)) {
            setAccountType(value);
            setShowInvalidAccountNotice(false);
          }
        }}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="First Name"
          name="firstName"
          type="text"
          placeholder="John"
          value={form.firstName}
          onChange={handleTextChange}
          error={errors.firstName}
          icon={FiUser}
          required
        />
        <Field
          label="Last Name"
          name="lastName"
          type="text"
          placeholder="Doe"
          value={form.lastName}
          onChange={handleTextChange}
          error={errors.lastName}
          icon={FiUser}
          required
        />
      </div>

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="john@example.com"
        value={form.email}
        onChange={handleTextChange}
        error={errors.email}
        icon={FiMail}
        required
      />

      <PhoneField
        label="Phone Number"
        value={form.phone}
        onChange={(phone: string) => setField("phone", phone)}
        error={errors.phone}
        required
        defaultCountry="ng"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.password}
          onChange={handleTextChange}
          error={errors.password}
          icon={FiLock}
          required
        />
        <Field
          label="Repeat Password"
          name="repeatPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.repeatPassword}
          onChange={handleTextChange}
          error={errors.repeatPassword}
          icon={FiLock}
          required
        />
      </div>

      <div className="pt-4">
        <Checkbox
          label={
            <span className="text-sm text-gray-600 leading-relaxed">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-violet-600 hover:underline font-medium"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-violet-600 hover:underline font-medium"
              >
                Privacy Policy
              </Link>
            </span>
          }
          name="agreeToTerms"
          checked={form.agreeToTerms}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setField("agreeToTerms", e.target.checked)
          }
        />
        {errors.agreeToTerms && (
          <p className="text-red-500 text-xs mt-1.5 ml-8">
            {errors.agreeToTerms}
          </p>
        )}
      </div>

      {notice && (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-3">
          <p className="text-sm text-green-700 dark:text-green-400">{notice}</p>
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<PageSpinner label="Setting up your registration form..." />}
    >
      <RegisterForm />
    </Suspense>
  );
}
