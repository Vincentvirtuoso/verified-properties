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
const UNAUTHORIZED: Snapshot = {
  user: null,
  role: null,
  status: "unauthorized",
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
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return fallback;
}

function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const authUser = session?.user;
  if (!authUser) return SIGNED_OUT;

  const [profileRes, adminRoles] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, name, avatar, phone, whatsapp_number, roles, active_role, is_email_verified, is_phone_verified, admin_status, created_at, updated_at",
      )
      .eq("id", authUser.id)
      .maybeSingle(),
    fetchAdminRoles(supabase, authUser.id),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) return UNAUTHORIZED;

  const user = mapProfileToUser(profileRes.data as Record<string, unknown>);
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

  const inFlightRef = useRef<Promise<Snapshot> | null>(null);
  const snapshotRef = useRef<Snapshot>({
    user: null,
    role: null,
    status: "loading",
  });

  const commit = useCallback((next: Snapshot) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const load = useCallback((): Promise<Snapshot> => {
    if (!inFlightRef.current) {
      inFlightRef.current = loadSession(supabase).finally(() => {
        inFlightRef.current = null;
      });
    }
    return inFlightRef.current;
  }, [supabase]);

  // Lenient refresh: on failure, keep whatever we already know.
  const refresh = useCallback(async () => {
    try {
      commit(await load());
    } catch (err) {
      console.error("[auth] refresh failed, keeping previous state", err);
    }
  }, [load, commit]);

  useEffect(() => {
    void refresh();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        commit(SIGNED_OUT);
        return;
      }
      if (
        event === "SIGNED_IN" ||
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED"
      ) {
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

        const next = await load();
        commit(next);
        if (next.status === "unauthorized") {
          await supabase.auth.signOut();
          commit(SIGNED_OUT);
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
      commit(SIGNED_OUT);
    }
    setAuthLoading(false);
    setIsLoggingOut(false);
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const refreshSession = useCallback(async () => {
    await supabase.auth.refreshSession();
    await refresh();
  }, [supabase, refresh]);

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
    refreshSession,
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
