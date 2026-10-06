"use client";

import { AuthForm } from "@/components/forms/AuthForm";
import { Field } from "@/components/ui/Field";
import { useState } from "react";
import { FiMail } from "react-icons/fi";
import { sendPasswordResetEmail } from "@/lib/supabase/auth";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(email.trim());
      setIsSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  if (isSubmitted) {
    return (
      <AuthForm
        title="Check Your Email"
        subtitle="We've sent a password reset link to your email"
        onSubmit={() => {}}
        footerText="Back to"
        footerLinkText="Sign in"
        footerHref="/login"
        showSocialLogins={false}
      >
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">📧</span>
          </div>
          <p className="text-gray-600 text-[15px]">
            If an account exists for <strong>{email}</strong>, you will receive
            a password reset link shortly.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsSubmitted(false);
            setEmail("");
          }}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 rounded-2xl transition-all"
        >
          Send Another Reset Link
        </button>
      </AuthForm>
    );
  }

  return (
    <AuthForm
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a reset link"
      onSubmit={handleSubmit}
      submitText={isLoading ? "Sending..." : "Send Reset Link"}
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerHref="/login"
      showSocialLogins={false}
    >
      <Field
        label="Email Address"
        name="email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={handleChange}
        error={error}
        required
        icon={FiMail}
      />

      <p className="text-xs text-gray-500 text-center mt-2">
        We&apos;ll send a secure link to reset your password.
      </p>
    </AuthForm>
  );
};

export default ForgotPasswordPage;
