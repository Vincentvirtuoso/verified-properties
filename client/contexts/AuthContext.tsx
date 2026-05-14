"use client";

import { User } from "@/types";
import { dummyUsers } from "@/data/users";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  authError: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (newUser: User) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
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
  const [users, setUsers] = useState<User[]>(dummyUsers);
  const [user, setUser] = useState<User | null>(null);
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
    async (newUser: User) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        await fakeDelay();

        if (users.some((u) => u.email === newUser.email)) {
          throw new Error("An account with this email already exists.");
        }

        setUsers((prev) => [...prev, newUser]);

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

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      await fakeDelay();
      setUser(null);
      setSessionCookie(false);
      localStorage.removeItem("dummy_user");
    } catch (error) {
      setAuthError("Logout failed. Please try again.");
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
