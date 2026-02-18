// src/infrastructure/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, LoginRequest } from "../../interfaces";
import { AuthService } from "../../core/application/services";
import { AuthRepository } from "../repositories";
import { getAuthToken, setAuthToken } from "../config/env";
import { ApiError } from "../api/api";
import i18n from "../i18n";

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string;
  login: (body: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider");
  }
  return ctx;
};

export interface AuthProviderProps {
  children: ReactNode;
}

const SELECTED_CONVERSATION_STORAGE_KEY = "ia_chat_selected_conversation_id";
const WIDGET_OPEN_STORAGE_KEY = "ia_chat_widget_open";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const login = async (body: LoginRequest) => {
    setLoading(true);
    setError("");

    try {
      const res = await authService.login(body);
      // AuthService ya hace setAuthToken(res.accessToken)
      setToken(res.accessToken);
      setUser(res.user);
    } catch (err: unknown) {
      console.error("[AuthContext] Error en login", err);

      if (err instanceof ApiError) {
        const t = i18n.t.bind(i18n);
        const lowerMessage = (err.message || "").toLowerCase();
        if (err.status === 0) {
          setError(t("login_error_network"));
        } else if (err.status === 401) {
          setError(t("login_error_invalid"));
        } else if (err.status === 403) {
          if (lowerMessage.includes("pending activation")) {
            setError(t("login_error_pending"));
          } else if (lowerMessage.includes("service key mismatch")) {
            setError(t("login_error_service_mismatch"));
          } else if (lowerMessage.includes("service api key required")) {
            setError(t("login_error_service_key_required"));
          } else if (lowerMessage.includes("service code required")) {
            setError(t("login_error_service_required"));
          } else if (lowerMessage.includes("service not subscribed")) {
            setError(t("login_error_not_subscribed"));
          } else if (lowerMessage.includes("user not allowed")) {
            setError(t("login_error_not_allowed"));
          } else if (lowerMessage.includes("service is suspended")) {
            setError(t("login_error_service_suspended"));
          } else {
            setError(t("login_error_forbidden"));
          }
        } else {
          setError(
            err.message || t("login_error_generic")
          );
        }
      } else {
        setError(i18n.t("login_error_generic"));
      }

      setToken(null);
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null); // borra cookie ia_chat_access_token
    setToken(null);
    setUser(null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SELECTED_CONVERSATION_STORAGE_KEY);
      window.localStorage.removeItem(WIDGET_OPEN_STORAGE_KEY);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      logout,
    }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
