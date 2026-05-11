"use client";

import { AuthForm } from "@/components/forms/AuthForm";
import { Field } from "@/components/ui/Field";
import { useState } from "react";
import { FiLock, FiMail } from "react-icons/fi";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("Logging in with:", formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <AuthForm
      title="Welcome Back"
      subtitle="Sign in to continue to your account"
      onSubmit={handleSubmit}
      submitText="Sign In"
      footerText="Don't have an account?"
      footerLinkText="Create one"
      footerHref="/register"
    >
      <Field
        label="Email Address"
        name="email"
        type="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
        icon={FiMail}
      />

      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
        icon={FiLock}
      />

      <div className="flex items-center justify-between text-sm pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="w-4 h-4 accent-violet-600 rounded border-gray-300 focus:ring-violet-500"
          />
          <span className="text-gray-700 font-medium">Remember me</span>
        </label>

        <a
          href="/forgot-password"
          className="text-violet-600 hover:text-violet-700 font-medium hover:underline transition-colors"
        >
          Forgot password?
        </a>
      </div>
    </AuthForm>
  );
};

export default LoginPage;
