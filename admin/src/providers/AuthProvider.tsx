"use client";

import {
  type AdminStatus,
  type PopulatedUser,
  Role,
  isAdminRole,
  isSuperAdminRole,
} from "@affilhomes/shared/types";
import {
  getCurrentProfile,
  signInWithEmail,
  signOut,
} from "@affilhomes/shared/supabase";
// import { createClient } from "@affilhomes/shared/supabase/client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { fetchUserRoles } from "@/features/auth/api/admin-roles.api";
import { createAdminBrowserClient } from "@/lib/supabase";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "pending"
  | "rejected"
  | "suspended"
  | "unauthorized";

interface AuthContextValue {
  user: PopulatedUser | null;
  /** Effective admin role for /admin. Null when not an active admin. */
  role: Role | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  authError: string | null;
  isSuperAdmin: boolean;
  login: (creds: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProfileToUser(profile: any): PopulatedUser {
  return {
    _id: profile.id,
    email: profile.email ?? "",
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    whatsappNumber: profile.whatsapp_number ?? "",
    avatar: profile.avatar ?? "",
    passwordHash: "",
    roles: profile.roles ?? [],
    activeRole: profile.active_role ?? Role.Viewer,
    isEmailVerified: profile.is_email_verified ?? false,
    isPhoneVerified: profile.is_phone_verified ?? false,
    companyId: undefined,
    companyRole: profile.company_role ?? undefined,
    viewerProfile: profile.viewer_profile ?? undefined,
    agentProfile: profile.agent_profile ?? undefined,
    adminStatus: (profile.admin_status ?? null) as AdminStatus | null,
    metadata: profile.metadata ?? {},
    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
    updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
  } as PopulatedUser;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err)
    return String((err as { message: unknown }).message);
  return fallback;
}

function resolveStatus(
  profile: PopulatedUser | null,
  adminRoles: Role[],
): AuthStatus {
  if (!profile) return "unauthenticated";
  const s = profile.adminStatus;
  if (s === "pending") return "pending";
  if (s === "rejected") return "rejected";
  if (s === "suspended") return "suspended";
  if (s !== "active") return "unauthorized";
  if (!adminRoles.some(isAdminRole)) return "unauthorized";
  return "authenticated";
}

function resolveEffectiveRole(
  profile: PopulatedUser | null,
  adminRoles: Role[],
): Role | null {
  if (!profile || profile.adminStatus !== "active") return null;
  if (adminRoles.some(isSuperAdminRole)) return Role.SuperAdmin;
  if (adminRoles.some((r) => r === Role.Admin)) return Role.Admin;
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PopulatedUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const inflightRef = useRef<Promise<PopulatedUser | null> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearError = useCallback(() => {
    if (mountedRef.current) setAuthError(null);
  }, []);

  const loadUser = useCallback(async (): Promise<PopulatedUser | null> => {
    // Deduplicate: StrictMode and login()+SIGNED_IN would otherwise fire
    // two Supabase round-trips back-to-back.
    if (inflightRef.current) return inflightRef.current;

    const run = (async () => {
      try {
        const profile = await getCurrentProfile();
        if (!mountedRef.current) return null;

        if (!profile) {
          setUser(null);
          setRole(null);
          setStatus("unauthenticated");
          return null;
        }

        const mapped = mapProfileToUser(profile);
        const adminRoles = await fetchUserRoles(mapped._id);
        if (!mountedRef.current) return null;

        setUser(mapped);
        setRole(resolveEffectiveRole(mapped, adminRoles));
        setStatus(resolveStatus(mapped, adminRoles));
        return mapped;
      } catch (err) {
        console.error("Failed to load admin user:", err);
        if (!mountedRef.current) return null;
        setUser(null);
        setRole(null);
        setStatus("unauthenticated");
        return null;
      } finally {
        inflightRef.current = null;
      }
    })();

    inflightRef.current = run;
    return run;
  }, []);

  useEffect(() => {
    void loadUser();

    const supabase = createAdminBrowserClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        if (!mountedRef.current) return;
        setUser(null);
        setRole(null);
        setStatus("unauthenticated");
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Defer: Supabase warns against calling its methods inside this
        // callback, and it also lets `loadUser()`'s inflight promise clear.
        setTimeout(() => {
          if (mountedRef.current) void loadUser();
        }, 0);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadUser]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        await signInWithEmail(email, password);
        await loadUser();
      } catch (err) {
        if (mountedRef.current) {
          setAuthError(errorMessage(err, "Login failed."));
        }
        throw err;
      } finally {
        if (mountedRef.current) setAuthLoading(false);
      }
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signOut();
      if (!mountedRef.current) return;
      setUser(null);
      setRole(null);
      setStatus("unauthenticated");
    } catch {
      if (mountedRef.current) setAuthError("Logout failed. Please try again.");
    } finally {
      if (mountedRef.current) setAuthLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const isSuperAdmin = role === Role.SuperAdmin;

  const value: AuthContextValue = {
    user,
    role,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    authLoading,
    authError,
    isSuperAdmin,
    login,
    logout,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
