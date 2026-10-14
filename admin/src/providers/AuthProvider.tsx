"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AdminStatus, PopulatedUser } from "@affilhomes/shared/types";
import { Role } from "@affilhomes/shared/types";

import { createAdminBrowserClient } from "@/lib/supabase";
import {
  fetchAdminRoles,
  type AdminRole,
} from "@/features/auth/api/admin-roles.api";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "pending"
  | "rejected"
  | "suspended"
  | "unauthorized";

type Snapshot = {
  user: PopulatedUser | null;
  role: AdminRole | null;
  status: AuthStatus;
};

const SIGNED_OUT: Snapshot = {
  user: null,
  role: null,
  status: "unauthenticated",
};

interface AuthContextValue {
  user: PopulatedUser | null;
  /** Effective admin role. Null unless the account is an active admin. */
  role: AdminRole | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  isSuperAdmin: boolean;
  authLoading: boolean;
  authError: string | null;
  login: (creds: { email: string; password: string }) => Promise<AuthStatus>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return fallback;
}

// Only the fields the admin UI reads. Everything else is left out on purpose.
function mapProfileToUser(profile: Record<string, unknown>): PopulatedUser {
  return {
    _id: String(profile.id),
    email: String(profile.email ?? ""),
    name: String(profile.name ?? ""),
    avatar: (profile.avatar as string | undefined) ?? "",
    phone: (profile.phone as string | undefined) ?? "",
    whatsappNumber: (profile.whatsapp_number as string | undefined) ?? "",
    passwordHash: "",
    roles: (profile.roles as PopulatedUser["roles"]) ?? [],
    activeRole: (profile.active_role as Role) ?? Role.Viewer,
    isEmailVerified: Boolean(profile.is_email_verified),
    isPhoneVerified: Boolean(profile.is_phone_verified),
    adminStatus: (profile.admin_status as AdminStatus | null) ?? null,
    companyId: undefined,
    createdAt: profile.created_at
      ? new Date(String(profile.created_at))
      : new Date(),
    updatedAt: profile.updated_at
      ? new Date(String(profile.updated_at))
      : new Date(),
  } as PopulatedUser;
}

function resolveRole(
  adminStatus: AdminStatus | null | undefined,
  adminRoles: AdminRole[],
): AdminRole | null {
  if (adminStatus !== "active") return null;
  if (adminRoles.includes("super_admin")) return "super_admin";
  if (adminRoles.includes("admin")) return "admin";
  return null;
}

function resolveStatus(
  adminStatus: AdminStatus | null | undefined,
  role: AdminRole | null,
): AuthStatus {
  switch (adminStatus) {
    case "pending":
      return "pending";
    case "rejected":
      return "rejected";
    case "suspended":
      return "suspended";
    case "active":
      return role ? "authenticated" : "unauthorized";
    default:
      return "unauthorized";
  }
}

async function loadSession(
  supabase: ReturnType<typeof createAdminBrowserClient>,
): Promise<Snapshot> {
  // getUser() verifies the token with Supabase. getSession() only reads the cookie.
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData.user) return SIGNED_OUT;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileErr) throw profileErr;
  if (!profile) return { user: null, role: null, status: "unauthorized" };

  const adminRoles = await fetchAdminRoles(supabase, authData.user.id);
  const user = mapProfileToUser(profile as Record<string, unknown>);
  const role = resolveRole(user.adminStatus, adminRoles);

  return { user, role, status: resolveStatus(user.adminStatus, role) };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createAdminBrowserClient());
  const [snapshot, setSnapshot] = useState<Snapshot>({
    user: null,
    role: null,
    status: "loading",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Each load gets an id; only the newest one is allowed to write state.
  const requestIdRef = useRef(0);

  const refresh = useCallback(async (): Promise<Snapshot> => {
    const id = ++requestIdRef.current;
    let next: Snapshot;
    try {
      next = await loadSession(supabase);
    } catch (err) {
      console.error("Failed to load admin session:", err);
      next = SIGNED_OUT;
    }
    if (id === requestIdRef.current) setSnapshot(next);
    return next;
  }, [supabase]);

  useEffect(() => {
    void refresh();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        requestIdRef.current++;
        setSnapshot(SIGNED_OUT);
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Defer: Supabase advises against calling its methods inside this callback.
        setTimeout(() => void refresh(), 0);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase, refresh]);

  const clearError = useCallback(() => setAuthError(null), []);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const next = await refresh();

        if (next.status === "unauthorized") {
          await supabase.auth.signOut();
          setSnapshot(SIGNED_OUT);
          setAuthError("This account doesn't have admin access.");
        }
        return next.status;
      } catch (err) {
        setAuthError(errorMessage(err, "Login failed."));
        throw err;
      } finally {
        setAuthLoading(false);
      }
    },
    [supabase, refresh],
  );

  const logout = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError("Logout failed. Please try again.");
    } else {
      setSnapshot(SIGNED_OUT);
    }
    setAuthLoading(false);
    setIsLoggingOut(false);
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const value: AuthContextValue = {
    user: snapshot.user,
    role: snapshot.role,
    status: snapshot.status,
    isAuthenticated: snapshot.status === "authenticated",
    isLoading: snapshot.status === "loading",
    isSuperAdmin: snapshot.role === "super_admin",
    isLoggingOut,
    authLoading,
    authError,
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
