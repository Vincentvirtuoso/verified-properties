"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "../ui/Button";
import { FiHome } from "react-icons/fi";
import SectionLabel from "../ui/SectionLabel";
import { BrandMark } from "../common/BrandMark";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
  loading?: boolean;
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
  loading,
}: AuthFormProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 transition-colors duration-200">
      <div className={cn("w-full max-w-md animate-fade-in", className)}>
        <div className="text-center mb-10">
          <BrandMark logoSize={50} logoOnly href="" />
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-neutral-500 dark:text-neutral-400 mt-3 text-[15px] max-w-xs mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Form Container Card */}
        <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-xl p-8 md:p-10 transition-all">
          <form onSubmit={onSubmit} className="space-y-6">
            {children}

            {submitText && (
              <Button
                size="lg"
                fullWidth
                type="submit"
                className="mt-2"
                isLoading={loading}
              >
                {submitText}
              </Button>
            )}

            {showSocialLogins && (
              <>
                <SectionLabel text="or continue with" />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 border border-border bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 py-3.5 rounded-2xl transition-all text-sm font-medium text-foreground cursor-pointer"
                  >
                    <Image
                      src="https://www.google.com/favicon.ico"
                      alt="Google"
                      className="w-5 h-5 grayscale-20 dark:grayscale-0"
                      width={80}
                      height={80}
                    />
                    Google
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 border border-border bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 py-3.5 rounded-2xl transition-all text-sm font-medium text-foreground cursor-pointer"
                  >
                    <Image
                      src="https://www.facebook.com/favicon.ico"
                      alt="Facebook"
                      className="w-5 h-5"
                      width={80}
                      height={80}
                    />
                    Facebook
                  </button>
                </div>
              </>
            )}

            {/* Footer Navigation */}
            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 pt-4">
              {footerText}{" "}
              <Link
                href={footerHref}
                className="text-primary font-semibold hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                {footerLinkText}
              </Link>
            </p>
          </form>
        </div>

        {/* Disclaimer Node */}
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-8">
          Your information is safe and secure
        </p>
      </div>
    </div>
  );
}
