"use client";

import { AuthForm } from "@/components/forms/AuthForm";
import { Field } from "@/components/ui/Field";
import { updatePassword } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiLock } from "react-icons/fi";

/**
 * Reached from the password-recovery email via /auth/callback, which has
 * already turned the link into a recovery session.
 */
const ResetPasswordPage = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== repeatPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update password. Request a new reset link.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Set a New Password"
      subtitle="Choose a new password for your account"
      onSubmit={handleSubmit}
      submitText={isLoading ? "Saving..." : "Update Password"}
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerHref="/login"
      showSocialLogins={false}
    >
      <Field
        label="New Password"
        name="password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        icon={FiLock}
      />
      <Field
        label="Repeat Password"
        name="repeatPassword"
        type="password"
        placeholder="••••••••"
        value={repeatPassword}
        onChange={(e) => setRepeatPassword(e.target.value)}
        error={error}
        required
        icon={FiLock}
      />
    </AuthForm>
  );
};

export default ResetPasswordPage;
