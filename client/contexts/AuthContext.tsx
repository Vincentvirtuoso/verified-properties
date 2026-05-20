"use client";

import { Company, PopulatedUser, Role } from "@/types";
import { dummyUsers } from "@/data/users";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { mockCompanies } from "@/data/companies";

interface AuthContextType {
  user: PopulatedUser | null;
  companies: Company[] | [];
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  authError: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (newUser: PopulatedUser, company?: Company) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  switchRole: (role: Role, currentRole: Role) => Promise<void>;
  updateUserRole: (
    userId: string,
    updates: Partial<PopulatedUser>,
  ) => Promise<PopulatedUser>;
  completeRegistration: (
    userId: string,
    updates: Partial<PopulatedUser>,
    company?: Company,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fakeDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

const isValidPassword = (input: string, storedHash: string) => {
  console.log(input);
  console.log(storedHash);

  return input === storedHash;
};

function setSessionCookie(active: boolean) {
  if (active) {
    document.cookie = "session=true; path=/; max-age=86400; SameSite=Lax";
  } else {
    document.cookie = "session=; path=/; max-age=0; SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<PopulatedUser[]>(dummyUsers);
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);

  const [user, setUser] = useState<PopulatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("dummy_user");
      if (savedUser) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to parse saved user:", error);
      localStorage.removeItem("dummy_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        await fakeDelay();

        if (Math.random() < 0.05) {
          throw new Error("Network error. Please try again.");
        }

        const foundUser = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );

        if (!foundUser) {
          throw new Error("Invalid email or password.");
        }

        if (!isValidPassword(password, foundUser.passwordHash)) {
          throw new Error("Invalid email or password.");
        }

        setUser(foundUser);
        setSessionCookie(true);
        localStorage.setItem("dummy_user", JSON.stringify(foundUser));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Login failed.";
        setAuthError(message);
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    [users],
  );

  const register = useCallback(
    async (newUser: PopulatedUser, company?: Company) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        await fakeDelay();

        if (users.some((u) => u.email === newUser.email)) {
          throw new Error("An account with this email already exists.");
        }

        setUsers((prev) => [...prev, newUser]);
        if (company) {
          setCompanies((prev) => [...prev, company]);
        }

        setUser(newUser);
        localStorage.setItem("dummy_user", JSON.stringify(newUser));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Registration failed.";
        setAuthError(message);
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    [users],
  );

  const updateUserRole = async (
    userId: string,
    updates: Partial<PopulatedUser>,
  ) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await fakeDelay();
      if (user && user._id === userId) {
        const updatedUser: PopulatedUser = {
          ...user,
          ...updates,
          agentProfile: updates.agentProfile
            ? { ...user.agentProfile, ...updates.agentProfile }
            : user.agentProfile,
          landlordProfile: updates.landlordProfile
            ? { ...user.landlordProfile, ...updates.landlordProfile }
            : user.landlordProfile,
          roles: updates.roles
            ? [...new Set([...user.roles, ...updates.roles])]
            : user.roles,
          updatedAt: new Date(),
        };

        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        return updatedUser;
      }

      throw new Error("User not found");
    } finally {
      setAuthLoading(false);
    }
  };

  const completeRegistration = useCallback(
    async (
      userId: string,
      updates: Partial<PopulatedUser>,
      company?: Company,
    ) => {
      setAuthLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (user && user._id === userId) {
          const updatedUser: PopulatedUser = {
            ...user,
            ...updates,
            agentProfile: updates.agentProfile
              ? { ...user.agentProfile, ...updates.agentProfile }
              : user.agentProfile,
            landlordProfile: updates.landlordProfile
              ? { ...user.landlordProfile, ...updates.landlordProfile }
              : user.landlordProfile,
            roles: updates.roles ?? user.roles,
            activeRole: updates.activeRole ?? user.activeRole,
            updatedAt: new Date(),
          };

          if (company) {
            updatedUser.companyId = company;
            updatedUser.companyRole = "admin";

            const existingCompanies = JSON.parse(
              localStorage.getItem("companies") || "[]",
            );
            existingCompanies.push(company);
            localStorage.setItem(
              "companies",
              JSON.stringify(existingCompanies),
            );
          }

          setUser(updatedUser);
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        }
      } finally {
        setAuthLoading(false);
      }
    },
    [user],
  );

  const switchRole = async (role: Role, currentRole: Role) => {
    const ALLOWED_TRANSITIONS: Record<string, Role[]> = {
      [Role.Viewer]: [Role.Agent, Role.Landlord],
      [Role.Agent]: [Role.Viewer, Role.Landlord],
      [Role.Landlord]: [Role.Viewer, Role.Agent],
    };
    setAuthLoading(true);
    setAuthError(null);
    try {
      await fakeDelay();

      const isValidTransition =
        currentRole &&
        role &&
        ALLOWED_TRANSITIONS[currentRole]?.includes(role) &&
        user?.roles.includes(currentRole);
      if (!isValidTransition) {
        throw new Error("Cannot switch role.");
      }
      if (user) {
        const updatedUser: PopulatedUser = {
          ...user,
          activeRole: role,
        };

        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.log(error);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      await fakeDelay();
      setUser(null);
      setSessionCookie(false);
      localStorage.removeItem("dummy_user");
    } catch (error) {
      setAuthError("Logout failed. Please try again.");
      console.log(error);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authLoading,
        authError,
        login,
        register,
        logout,
        clearError,
        companies,
        updateUserRole,
        switchRole,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
