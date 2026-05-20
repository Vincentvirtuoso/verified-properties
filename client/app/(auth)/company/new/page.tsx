"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import FileUpload from "@/components/ui/FileUpload";
import { LuMail, LuPhone } from "react-icons/lu";
import type { CompanyType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function NewCompanyPage() {
  const router = useRouter();
  const { user, completeRegistration, isLoading, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [type, setType] = useState<CompanyType>("real_estate_company");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }

    try {
      const companyPayload = {
        _id: crypto.randomUUID?.() || Date.now().toString(),
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        type,
        verificationStatus: "unverified" as const,
        features: {
          whatsappNotifications: false,
          prioritySupport: false,
          dedicatedAccountManager: false,
          whiteLabel: false,
        },
        team: [],
        contactEmail: email,
        contactPhone: phone,
        activeListings: 0,
        totalRemitted: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (logo) {
      }

      await completeRegistration(user!._id, {}, companyPayload);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create company.",
      );
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Register your company
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Fill in the details below to start managing listings as a company.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field
            label="Company name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Green Homes Ltd"
            required
            error={error && !name ? error : undefined}
          />

          <Select
            label="Company type"
            options={[
              { value: "real_estate_company", label: "Real Estate Company" },
              { value: "developer", label: "Developer" },
            ]}
            value={type}
            onChange={(val) => setType(val as CompanyType)}
            required
          />

          <Field
            label="Contact email"
            name="contactEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@company.com"
            icon={LuMail}
            required
          />

          <Field
            label="Contact phone"
            name="contactPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 ..."
            icon={LuPhone}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Company logo (optional)
            </label>
            <FileUpload
              maxSizeInMB={2}
              allowedTypes={["image/jpeg", "image/png", "image/webp"]}
              maxFiles={1}
              onUploadComplete={(files) => setLogo(files[0] || null)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth isLoading={isLoading}>
            Create Company
          </Button>
        </form>
      </div>
    </div>
  );
}
