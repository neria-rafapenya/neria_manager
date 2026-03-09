import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { AuthUser } from "@/domain/models/auth";
import { AuthService } from "@/domain/services/auth.service";
import { HttpAuthRepository } from "@/infrastructure/repositories/auth.repository.http";
import { clearAuthToken, readAuthToken, writeAuthToken } from "@/adapters/http/auth-token";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<{ role: AuthUser["role"] }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const authService = useMemo(() => new AuthService(new HttpAuthRepository()), []);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      const token = readAuthToken();
      if (!token) {
        if (isMounted) {
          setIsReady(true);
        }
        return;
      }

      try {
        const me = await authService.me();
        if (isMounted) {
          setUser(me);
        }
      } catch {
        clearAuthToken();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, [authService]);

  const login = async (email: string, password: string) => {
    const session = await authService.login({ email, password });
    writeAuthToken(session.accessToken);
    setUser(session.user);
    return { role: session.user.role };
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isReady,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("AuthProvider missing");
  }
  return context;
}
