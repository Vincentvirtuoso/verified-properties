"use client";

import { AuthForm } from "@/components/forms/AuthForm";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiMail } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { PageSpinner } from "@/components/ui/Spinner";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, authLoading, authError, clearError, isAuthenticated, user } =
    useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const callbackUrl = searchParams.get("callbackUrl");

  const getSafeRedirectUrl = (url: string | null): string | null => {
    if (!url) return null;
    try {
      const urlObj = new URL(url, window.location.origin);
      if (urlObj.origin === window.location.origin) {
        return urlObj.pathname + urlObj.search + urlObj.hash;
      }
    } catch {
      if (url.startsWith("/")) return url;
    }
    return null;
  };

  const safeCallbackUrl = getSafeRedirectUrl(callbackUrl);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (safeCallbackUrl) {
        router.push(safeCallbackUrl);
        return;
      }
      const roleRoutes: Record<string, string> = {
        buyer: "/",
        agent: "/dashboard",
        landlord: "/dashboard",
        developer: "/dashboard",
        company: "/company/dashboard",
      };
      const redirectTo = roleRoutes[user.activeRole] || "/";
      router.push(redirectTo);
    }
  }, [isAuthenticated, user, router, safeCallbackUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (authError) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      await login({ email: formData.email, password: formData.password });
    } catch (err) {
      console.log(err);
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
      loading={authLoading}
    >
      {authError && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
          {authError}
        </div>
      )}

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
        <Checkbox
          label="Remember me"
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleChange}
        />

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

const LoginPage = () => {
  return (
    <Suspense fallback={<PageSpinner label="Loading Form context" />}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
