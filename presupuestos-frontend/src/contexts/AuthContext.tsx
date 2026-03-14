import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth";
import { authService } from "../services/authService";
import { clearSession, loadSession, saveSession } from "../services/session";

interface AuthContextValue {
  session: AuthResponse | null;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(() => loadSession());

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload);
    saveSession(response);
    setSession(response);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const response = await authService.register(payload);
    saveSession(response);
    setSession(response);
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await authService.changePassword({ currentPassword, newPassword });
      setSession((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          user: { ...prev.user, mustChangePassword: false },
        };
        saveSession(updated);
        return updated;
      });
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, login, register, changePassword, logout }),
    [session, login, register, changePassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
