"use client";

import {
  Company,
  PopulatedUser,
  Role,
  LOCKED_ROLES,
  CompanyRegistration,
} from "@affilhomes/shared/types";

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
} from "@affilhomes/shared/supabase";
import {
  createCompanyForCurrentUser,
  getCompanyWithTeam,
  mapCompanyRow,
  slugifyCompanyName,
  submitCompanyOnboardingDocs,
} from "@affilhomes/shared/supabase";
import { uploadUserFile } from "@affilhomes/shared/supabase";
import { createClient } from "@affilhomes/shared/supabase/client";
import {
  setMyRoles,
  switchActiveRole,
} from "@affilhomes/shared/supabase/roles";
import { ProfileRole } from "@/utils";
import { RegistrationGuard } from "@/components/common/RegistrationGuard";

export interface CompanyOnboardingFiles {
  logo?: File | null;
  cacCertificate?: File | null;
}

export interface ProfileUpdateFiles {
  avatar?: File | null;
}

interface CompanyRegistrationDraft {
  companyName: string;
  companyType: CompanyRegistration["companyType"];
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
}

interface AuthContextType {
  user: PopulatedUser | null;
  companies: Company[];
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  authError: string | null;
  isSuspended: boolean;
  suspensionReason: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (
    newUser: PopulatedUser,
    password: string,
    company?: Company,
    options?: { next?: string; accountType: "company" | "agent" | "seeker" },
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  switchRole: (newRole: Role) => Promise<void>;
  updateUserRole: (
    userId: string,
    updates: Partial<PopulatedUser>,
  ) => Promise<PopulatedUser>;
  updateProfile: (
    updates: Partial<PopulatedUser>,
    files?: ProfileUpdateFiles,
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
  pendingRegistration: CompanyRegistration | null;
  saveCompanyRegistrationDraft: (
    fields: CompanyRegistrationDraft,
  ) => Promise<void>;
  submitCompanyRegistration: (files: {
    cacCertificate: File;
    logo?: File | null;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProfileToUser(profile: any, company?: Company): PopulatedUser {
  return {
    _id: profile.id,
    email: profile.email ?? "",
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    whatsappNumber: profile.whatsapp_number ?? "",
    avatar: profile.avatar ?? "",

    passwordHash: "",

    roles: profile.roles ?? ["viewer"],
    activeRole: profile.active_role ?? "viewer",

    isEmailVerified: profile.is_email_verified ?? false,
    isPhoneVerified: profile.is_phone_verified ?? false,

    companyId: company,
    companyRole: profile.company_role ?? undefined,

    viewerProfile: profile.viewer_profile ?? undefined,
    agentProfile: profile.agent_profile ?? undefined,

    metadata: profile.metadata ?? {},

    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),

    updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
  } as PopulatedUser;
}
function mapRegistration(row: any): CompanyRegistration {
  return {
    id: row.id,
    status: row.status,
    companyName: row.company_name ?? "",
    companyType: row.company_type ?? null,
    contactEmail: row.contact_email ?? "",
    contactPhone: row.contact_phone ?? "",
    whatsappNumber: row.whatsapp_number ?? "",
    logoUrl: row.logo_url ?? null,
    rejectionReason: row.rejection_reason ?? null,
  };
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PopulatedUser | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);
  const [pendingRegistration, setPendingRegistration] =
    useState<CompanyRegistration | null>(null);

  const userId = user?._id;
  const supabase = createClient();

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const loadUser = useCallback(async (): Promise<PopulatedUser | null> => {
    try {
      const profile = await getCurrentProfile();

      if (!profile) {
        setUser(null);
        setCompanies([]);
        setPendingRegistration(null);
        setIsSuspended(false);
        setSuspensionReason(null);
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

      const { data: suspended, error: suspendedError } = await supabase.rpc(
        "is_suspended",
        { _user_id: profile.id },
      );

      if (suspendedError) {
        console.error("Suspension check failed:", suspendedError);
      }

      const active = suspendedError ? false : Boolean(suspended);
      setIsSuspended(active);

      if (active) {
        const { data: row } = await supabase
          .from("account_suspensions")
          .select("reason")
          .eq("subject_type", "user")
          .eq("subject_id", profile.id)
          .maybeSingle();
        setSuspensionReason(row?.reason ?? null);
      } else {
        setSuspensionReason(null);
      }

      const mapped = mapProfileToUser(profile, company);
      setUser(mapped);
      setCompanies(company ? [company] : []);
      const { data: regRow } = await supabase
        .from("company_registrations")
        .select("*")
        .in("status", ["draft", "docs_submitted", "rejected"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPendingRegistration(regRow ? mapRegistration(regRow) : null);
      return mapped;
    } catch (error) {
      console.error("Failed to load authenticated user:", error);
      setUser(null);
      setCompanies([]);
      setPendingRegistration(null);
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

    const supabase = createClient();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setCompanies([]);
        setPendingRegistration(null);
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setTimeout(() => {
          if (mounted) void loadUser();
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadUser]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`account-suspensions:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "account_suspensions" },
        () => {
          void loadUser();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, loadUser]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") void loadUser();
    };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [loadUser]);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
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
      options?: { next?: string; accountType: "company" | "agent" | "seeker" },
    ) => {
      setAuthLoading(true);
      setAuthError(null);

      try {
        const { session } = await signUpWithEmail(
          newUser.email,
          password,
          newUser.name,
          {
            phone: newUser.phone,
            whatsappNumber: newUser.whatsappNumber ?? newUser.phone,
            next: options?.next,
            accountType:options?.accountType,
          },
        );

        void company;

        if (!session) {
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

  const saveCompanyRegistrationDraft = useCallback(
    async (fields: CompanyRegistrationDraft) => {
      if (!user) throw new Error("No user logged in");
      const supabase = createClient();
      const payload = {
        company_name: fields.companyName.trim(),
        company_type: fields.companyType,
        contact_email: fields.contactEmail.trim(),
        contact_phone: fields.contactPhone.trim() || null,
        whatsapp_number: fields.whatsappNumber.trim() || null,
      };

      // Draft and rejected rows are handled differently: a rejected registration
      // is a closed record, so starting again creates a new draft.
      const { error } =
        pendingRegistration?.status === "draft"
          ? await supabase
              .from("company_registrations")
              .update({ ...payload, updated_at: new Date().toISOString() })
              .eq("id", pendingRegistration.id)
          : await supabase
              .from("company_registrations")
              .insert({ ...payload, user_id: user._id, status: "draft" });

      if (error) throw error;
      await loadUser();
    },
    [user, pendingRegistration, loadUser],
  );

  const submitCompanyRegistration = useCallback(
    async (files: { cacCertificate: File; logo?: File | null }) => {
      if (!user) throw new Error("No user logged in");
      const supabase = createClient();

      const logoUrl = files.logo
        ? await uploadUserFile(
            "avatars",
            user._id,
            files.logo,
            files.logo.name,
            supabase,
          )
        : null;
      const cacPath = await uploadUserFile(
        "company-documents",
        user._id,
        files.cacCertificate,
        files.cacCertificate.name,
        supabase,
      );

      const { error } = await supabase.rpc("submit_company_registration", {
        p_cac_path: cacPath,
        p_logo_url: logoUrl,
      });
      if (error) throw error;
      await loadUser();
    },
    [user, loadUser],
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
        if (updates.roles) {
          await setMyRoles(updates.roles, createClient());
        }

        const otherFields = toProfileUpdates({
          ...updates,
          roles: undefined,
          metadata: {
            ...user.metadata,
            ...(updates.metadata ?? {}),
            lastRoleSwitch: new Date(),
          },
        });
        if (Object.keys(otherFields).length > 0) {
          await updateCurrentProfile(userId, otherFields);
        }

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

  const updateProfile = useCallback(
    async (
      updates: Partial<PopulatedUser>,
      files?: ProfileUpdateFiles,
    ): Promise<PopulatedUser> => {
      if (!user) {
        throw new Error("No user logged in");
      }

      setAuthLoading(true);
      setAuthError(null);

      try {
        let avatar = updates.avatar;
        if (files?.avatar) {
          avatar = await uploadUserFile(
            "avatars",
            user._id,
            files.avatar,
            files.avatar.name,
          );
        }

        const mergedUpdates: Partial<PopulatedUser> = {
          ...updates,
          avatar,
          metadata:
            updates.metadata !== undefined
              ? { ...user.metadata, ...updates.metadata }
              : undefined,
        };

        const payload = toProfileUpdates(mergedUpdates);

        if (Object.keys(payload).length > 0) {
          await updateCurrentProfile(user._id, payload);
        }

        const updated = await loadUser();
        if (!updated) throw new Error("Failed to reload profile");
        return updated;
      } catch (error) {
        setAuthError(errorMessage(error, "Failed to update profile."));
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
        const profileUpdates = toProfileUpdates(updates);
        if (Object.keys(profileUpdates).length > 0) {
          await updateCurrentProfile(userId, profileUpdates);
        }

        if (company) {
          const logoUrl = files?.logo
            ? await uploadUserFile(
                "avatars",
                userId,
                files.logo,
                files.logo.name,
              )
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
      if (!user) throw new Error("No user logged in");

      setAuthLoading(true);
      setAuthError(null);

      try {
        await switchActiveRole(newRole, createClient());
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
      setIsSuspended(false);
      setSuspensionReason(null);
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
        isSuspended,
        suspensionReason,
        login,
        register,
        logout,
        clearError,
        refreshUser,
        switchRole,
        updateUserRole,
        updateProfile,
        pendingRegistration,
        saveCompanyRegistrationDraft,
        submitCompanyRegistration,
        completeRegistration,
      }}
    >
      <RegistrationGuard>{children}</RegistrationGuard>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
