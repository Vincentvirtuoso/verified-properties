"use client";

import {
  Company,
  PopulatedUser,
  Role,
  LOCKED_ROLES,
} from "@/types";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  getCurrentProfile,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updateCurrentProfile,
} from "@/lib/supabase/auth";
import {
  createCompanyForCurrentUser,
  getCompanyWithTeam,
  mapCompanyRow,
  slugifyCompanyName,
  submitCompanyOnboardingDocs,
} from "@/lib/supabase/companies";
import { uploadUserFile } from "@/lib/supabase/storage";
import { createClient } from "@/lib/supabase/client";

export interface CompanyOnboardingFiles {
  logo?: File | null;
  cacCertificate?: File | null;
}

interface AuthContextType {
  user: PopulatedUser | null;
  companies: Company[];
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  authError: string | null;
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<void>;
  /**
   * Creates the auth account. Resolves to true when the user is signed in
   * immediately, false when they must confirm their email first.
   */
  register: (
    newUser: PopulatedUser,
    password: string,
    company?: Company,
    options?: { next?: string },
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  switchRole: (newRole: Role) => Promise<void>;
  updateUserRole: (
    userId: string,
    updates: Partial<PopulatedUser>,
  ) => Promise<PopulatedUser>;
  completeRegistration: (
    userId: string,
    updates: Partial<PopulatedUser>,
    company?: Company,
    files?: CompanyOnboardingFiles,
  ) => Promise<void>;
  createCompany: (companyData: {
    name: string;
    slug: string;
    type: "real_estate_company" | "developer" | "broker";
    contactEmail: string;
    contactPhone?: string;
    whatsappNumber?: string;
    logo?: string;
  }) => Promise<Company>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProfileToUser(profile: any, company?: Company): PopulatedUser {
  return {
    _id: profile.id,
    email: profile.email ?? "",
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    whatsappNumber: profile.whatsapp_number ?? "",
    avatar: profile.avatar ?? "",

    // Supabase Auth owns the password.
    // This field only exists because the existing frontend type requires it.
    passwordHash: "",

    roles: profile.roles ?? ["viewer"],
    activeRole: profile.active_role ?? "viewer",

    isEmailVerified: profile.is_email_verified ?? false,
    isPhoneVerified: profile.is_phone_verified ?? false,

    // PopulatedUser expects the populated Company object here.
    companyId: company,
    companyRole: profile.company_role ?? undefined,

    viewerProfile: profile.viewer_profile ?? undefined,
    agentProfile: profile.agent_profile ?? undefined,

    metadata: profile.metadata ?? {},

    createdAt: profile.created_at
      ? new Date(profile.created_at)
      : new Date(),

    updatedAt: profile.updated_at
      ? new Date(profile.updated_at)
      : new Date(),
  } as PopulatedUser;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Only columns the user may edit are sent; the DB guard enforces the rest. */
function toProfileUpdates(updates: Partial<PopulatedUser>) {
  const out: Record<string, unknown> = {};
  if (updates.name !== undefined) out.name = updates.name;
  if (updates.phone !== undefined) out.phone = updates.phone;
  if (updates.whatsappNumber !== undefined)
    out.whatsapp_number = updates.whatsappNumber;
  if (updates.avatar !== undefined) out.avatar = updates.avatar;
  if (updates.roles !== undefined)
    // "company" is granted only by the company onboarding RPC.
    out.roles = updates.roles.filter((r) => r !== Role.Company);
  if (updates.activeRole !== undefined && updates.activeRole !== Role.Company)
    out.active_role = updates.activeRole;
  if (updates.viewerProfile !== undefined)
    out.viewer_profile = updates.viewerProfile;
  if (updates.agentProfile !== undefined)
    out.agent_profile = updates.agentProfile;
  if (updates.metadata !== undefined) out.metadata = updates.metadata;
  return out;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error)
    return String((error as { message: unknown }).message);
  return fallback;
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<PopulatedUser | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  /** Loads profile + company (with team) for the signed-in user. */
  const loadUser = useCallback(async (): Promise<PopulatedUser | null> => {
    try {
      const profile = await getCurrentProfile();

      if (!profile) {
        setUser(null);
        setCompanies([]);
        return null;
      }

      let company: Company | undefined;
      if (profile.company_id) {
        try {
          company = (await getCompanyWithTeam(profile.company_id)) ?? undefined;
        } catch (error) {
          console.error("Failed to load company:", error);
        }
      }

      const mapped = mapProfileToUser(profile, company);
      setUser(mapped);
      setCompanies(company ? [company] : []);
      return mapped;
    } catch (error) {
      console.error("Failed to load authenticated user:", error);
      setUser(null);
      setCompanies([]);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await loadUser();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initialize();

    // Keep state in sync with sign-in/out in other tabs, token refresh,
    // and email-link sessions.
    const supabase = createClient();
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setCompanies([]);
          return;
        }
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          // Defer to avoid calling Supabase inside the auth callback.
          setTimeout(() => {
            if (mounted) void loadUser();
          }, 0);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadUser]);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const login = useCallback(
    async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      setAuthLoading(true);
      setAuthError(null);

      try {
        await signInWithEmail(email, password);
        await loadUser();
      } catch (error) {
        setAuthError(errorMessage(error, "Login failed."));
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    [loadUser],
  );

  const register = useCallback(
    async (
      newUser: PopulatedUser,
      password: string,
      company?: Company,
      options?: { next?: string },
    ) => {
      setAuthLoading(true);
      setAuthError(null);

      try {
        // Supabase creates auth.users; the handle_new_user() trigger
        // creates the profiles row with name, phone and WhatsApp.
        const { session } = await signUpWithEmail(
          newUser.email,
          password,
          newUser.name,
          {
            phone: newUser.phone,
            whatsappNumber: newUser.whatsappNumber ?? newUser.phone,
            next: options?.next,
          },
        );

        // Company details are collected later on /complete-registration.
        void company;

        if (!session) {
          // Email confirmation is required before a session exists.
          return false;
        }

        await loadUser();
        return true;
      } catch (error) {
        setAuthError(errorMessage(error, "Registration failed."));
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    [loadUser],
  );

  const updateUserRole = useCallback(
    async (
      userId: string,
      updates: Partial<PopulatedUser>,
    ): Promise<PopulatedUser> => {
      if (!user || user._id !== userId) {
        throw new Error("User not found");
      }

      setAuthLoading(true);
      setAuthError(null);

      try {
        const payload = toProfileUpdates({
          ...updates,
          roles: updates.roles
            ? [...new Set([...user.roles, ...updates.roles])]
            : undefined,
          metadata: {
            ...user.metadata,
            ...(updates.metadata ?? {}),
            lastRoleSwitch: new Date(),
          },
        });

        await updateCurrentProfile(userId, payload);
        const updated = await loadUser();
        if (!updated) throw new Error("Failed to reload profile");
        return updated;
      } catch (error) {
        setAuthError(errorMessage(error, "Failed to update role."));
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    [user, loadUser],
  );

  const createCompany = useCallback(
    async (companyData: {
      name: string;
      slug: string;
      type: "real_estate_company" | "developer" | "broker";
      contactEmail: string;
      contactPhone?: string;
      whatsappNumber?: string;
      logo?: string;
    }) => {
      if (!user) {
        throw new Error("No user logged in");
      }

      setAuthLoading(true);
      setAuthError(null);

      try {
        const row = await createCompanyForCurrentUser(companyData);
        await loadUser();
        return mapCompanyRow(row, [
          { user_id: user._id, role: "admin", permissions: [] },
        ]);
      } catch (error) {
        setAuthError(errorMessage(error, "Failed to create company."));
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    [user, loadUser],
  );

  const completeRegistration = useCallback(
    async (
      userId: string,
      updates: Partial<PopulatedUser>,
      company?: Company,
      files?: CompanyOnboardingFiles,
    ) => {
      if (!user || user._id !== userId) {
        throw new Error("User not found");
      }

      setAuthLoading(true);
      setAuthError(null);

      try {
        // 1. Ordinary profile fields (name, phone, agent profile, roles...).
        const profileUpdates = toProfileUpdates(updates);
        if (Object.keys(profileUpdates).length > 0) {
          await updateCurrentProfile(userId, profileUpdates);
        }

        // 2. Company onboarding: atomic RPC creates the company, the admin
        //    membership and grants the company role.
        if (company) {
          // Upload files first so a failed upload never leaves a company
          // without its documents (the RPC allows one company per user).
          const logoUrl = files?.logo
            ? await uploadUserFile("avatars", userId, files.logo, files.logo.name)
            : undefined;
          const cacPath = files?.cacCertificate
            ? await uploadUserFile(
                "company-documents",
                userId,
                files.cacCertificate,
                files.cacCertificate.name,
              )
            : undefined;

          const created = await createCompanyForCurrentUser({
            name: company.name,
            slug: slugifyCompanyName(company.name),
            type: company.type,
            contactEmail: company.contactEmail,
            contactPhone: company.contactPhone,
            whatsappNumber: company.whatsappNumber,
            logo: logoUrl,
          });

          if (cacPath) {
            await submitCompanyOnboardingDocs(created.id, {
              cacCertificateUrl: cacPath,
              companyLogoUrl: logoUrl,
            });
          }
        }

        await loadUser();
      } catch (error) {
        setAuthError(errorMessage(error, "Failed to complete registration."));
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    [user, loadUser],
  );

  const switchRole = useCallback(
    async (newRole: Role) => {
      if (!user) {
        throw new Error("No user logged in");
      }

      setAuthLoading(true);
      setAuthError(null);

      try {
        if (LOCKED_ROLES.includes(user.activeRole)) {
          throw new Error("This account role cannot be changed.");
        }

        if (!user.roles.includes(newRole)) {
          throw new Error("You cannot switch to this role.");
        }

        await updateCurrentProfile(user._id, {
          active_role: newRole,
          metadata: {
            ...user.metadata,
            lastRoleSwitch: new Date().toISOString(),
          },
        });

        await loadUser();
      } catch (error) {
        setAuthError(errorMessage(error, "Failed to switch role."));
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    [user, loadUser],
  );

  const logout = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      await signOut();
      setUser(null);
      setCompanies([]);
    } catch (error) {
      setAuthError("Logout failed. Please try again.");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        companies,
        createCompany,
        isAuthenticated: !!user,
        isLoading,
        authLoading,
        authError,
        login,
        register,
        logout,
        clearError,
        refreshUser,
        switchRole,
        updateUserRole,
        completeRegistration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider",
    );
  }

  return context;
}
