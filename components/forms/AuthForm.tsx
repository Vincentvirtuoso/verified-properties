"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "../ui/Button";
import { FiHome } from "react-icons/fi";
import SectionLabel from "../ui/SectionLabel";
import { cn } from "@/lib/utils";

type AuthFormProps = {
  title: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
  submitText?: string;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
  showSocialLogins?: boolean;
  className?: string;
};

export function AuthForm({
  title,
  subtitle,
  onSubmit,
  children,
  submitText,
  footerText,
  footerLinkText,
  footerHref,
  showSocialLogins = true,
  className,
}: AuthFormProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className={cn("w-full max-w-md", className)}>
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-3xl font-bold tracking-tighter">
              <FiHome />
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600 mt-3 text-[15px] max-w-xs mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/70 p-8 md:p-10">
          <form onSubmit={onSubmit} className="space-y-6">
            {children}

            {submitText && (
              <Button size="lg" fullWidth type="submit" className="mt-2">
                {submitText}
              </Button>
            )}

            {showSocialLogins && (
              <>
                <SectionLabel text="or continue with" />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 py-3.5 rounded-2xl transition-all text-sm font-medium"
                  >
                    <img
                      src="https://www.google.com/favicon.ico"
                      alt="Google"
                      className="w-5 h-5"
                    />
                    Google
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 py-3.5 rounded-2xl transition-all text-sm font-medium"
                  >
                    <img
                      src="https://www.facebook.com/favicon.ico"
                      alt="Facebook"
                      className="w-5 h-5"
                    />
                    Facebook
                  </button>
                </div>
              </>
            )}

            <p className="text-center text-sm text-gray-600 pt-4">
              {footerText}{" "}
              <Link
                href={footerHref}
                className="text-violet-600 font-semibold hover:underline transition-colors"
              >
                {footerLinkText}
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Your information is safe and secure
        </p>
      </div>
    </div>
  );
}
