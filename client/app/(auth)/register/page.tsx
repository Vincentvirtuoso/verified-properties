"use client";

import { useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaUserTag,
  FaIdCardAlt,
} from "react-icons/fa";
import Link from "next/link";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Field } from "@/components/ui/Field";
import { AuthForm } from "@/components/forms/AuthForm";
import { FiLock, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { PhoneField } from "@/components/ui/PhoneField";

const accountTypes = [
  {
    value: "seeker",
    label: "Seeker Account",
    description: "For Those Looking For Real-Estate Services",
  },
  {
    value: "broker",
    label: "Broker Account",
    description: "For Those Offering Real-Estate Services",
  },
  {
    value: "company",
    label: "Company Account",
    description: "For Real-Estate Agencies and Companies",
  },
  {
    value: "developer",
    label: "Developer Account",
    description: "For Real-Estate Developers",
  },
  {
    value: "landlord",
    label: "Landlord Account",
    description: "For Property Owners and Landlords",
  },
];

export default function RegisterPage() {
  const [accountType, setAccountType] = useState("seeker");
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    password: "",
    repeatPassword: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.repeatPassword) {
      newErrors.repeatPassword = "Passwords do not match";
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the Terms & Conditions";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("Registration Data:", { accountType, ...formData });
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
    >
      <RadioGroup
        label="Account Type"
        name="accountType"
        options={accountTypes}
        value={accountType}
        onChange={setAccountType}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="First Name"
          name="firstName"
          type="text"
          placeholder="John"
          value={formData.firstName}
          onChange={handleInputChange}
          error={errors.firstName}
          icon={FiUser}
          required
        />

        <Field
          label="Last Name"
          name="lastName"
          type="text"
          placeholder="Doe"
          value={formData.lastName}
          onChange={handleInputChange}
          error={errors.lastName}
          icon={FiUser}
          required
        />
      </div>

      <Field
        label="Email"
        name="email"
        type="email"
        placeholder="john@example.com"
        value={formData.email}
        onChange={handleInputChange}
        error={errors.email}
        icon={FiMail}
        required
      />

      <Field
        label="Username"
        name="username"
        type="text"
        placeholder="johndoe"
        value={formData.username}
        onChange={handleInputChange}
        error={errors.username}
        icon={FaIdCardAlt}
        required
      />

      <PhoneField
        label="Phone Number"
        value={formData.phone}
        onChange={(phone) => {
          setFormData((prev) => ({ ...prev, phone }));
          if (errors.phone) {
            setErrors((prev) => ({ ...prev, phone: "" }));
          }
        }}
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
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          icon={FiLock}
          required
        />

        <Field
          label="Repeat Password"
          name="repeatPassword"
          type="password"
          placeholder="••••••••"
          value={formData.repeatPassword}
          onChange={handleInputChange}
          error={errors.repeatPassword}
          icon={FiLock}
          required
        />
      </div>

      <div className="pt-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            className="mt-1 w-5 h-5 accent-violet-600 rounded border-gray-300 focus:ring-violet-500 cursor-pointer"
          />
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
        </label>

        {errors.agreeToTerms && (
          <p className="text-red-500 text-xs mt-1.5 ml-8">
            {errors.agreeToTerms}
          </p>
        )}
      </div>
    </AuthForm>
  );
}
