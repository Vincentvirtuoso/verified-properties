"use client";

import { useState } from "react";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserTag } from "react-icons/fa";
import Link from "next/link";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Field } from "@/components/ui/Field";

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
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registration Data:", { accountType, ...formData });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join Nigeria's leading real estate platform</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <RadioGroup
              label="Account Type *"
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
                icon={FaUser}
                required
              />

              <Field
                label="Last Name"
                name="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleInputChange}
                icon={FaUser}
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
              icon={FaEnvelope}
              required
            />

            <Field
              label="Username"
              name="username"
              type="text"
              placeholder="johndoe"
              value={formData.username}
              onChange={handleInputChange}
              icon={FaUserTag}
              required
            />

            <Field
              label="Phone"
              name="phone"
              type="tel"
              placeholder="+234 801 234 5678"
              value={formData.phone}
              onChange={handleInputChange}
              icon={FaPhone}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                icon={FaLock}
                required
              />

              <Field
                label="Repeat Password"
                name="repeatPassword"
                type="password"
                placeholder="••••••••"
                value={formData.repeatPassword}
                onChange={handleInputChange}
                icon={FaLock}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-violet-200 active:scale-[0.985]"
            >
              Create Account
            </button>

            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-400 py-3.5 rounded-xl transition-all"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-400 py-3.5 rounded-xl transition-all"
              >
                <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="w-5 h-5" />
                Continue with Facebook
              </button>
            </div>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-600 font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}