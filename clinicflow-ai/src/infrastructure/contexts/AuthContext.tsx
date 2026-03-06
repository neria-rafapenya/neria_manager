import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "../../core/domain/auth";
import { AuthService } from "../../core/application/services/AuthService";
import { AuthRepository } from "../repositories/AuthRepository";
import { ApiError } from "../api/api";
import {
  getApiBaseUrl,
  getAuthToken,
  getServiceApiKey,
  getTenantId,
  isAuthDebugEnabled,
  setAuthToken,
} from "../config/env";

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string;
  login: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  loginWithProvider: (provider: "google" | "facebook") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "clinicflow_user";

const loadStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

const persistUser = (user: AuthUser | null) => {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    } else {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore
  }
};

const maskSecret = (value?: string | null) => {
  if (!value) return "";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
};

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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const storedUser = getAuthToken() ? loadStoredUser() : null;
  const [user, setUser] = useState<AuthUser | null>(storedUser);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (body: LoginRequest) => {
    setLoading(true);
    setError("");
    try {
      const apiKey = getServiceApiKey();
      const tenantId = getTenantId();

      if (isAuthDebugEnabled()) {
        console.info("[clinicflow auth] env", {
          apiBaseUrl: getApiBaseUrl(),
          tenantId,
          apiKey: maskSecret(apiKey),
        });
      }

      if (!apiKey) {
        setError("Falta VITE_API_KEY para este servicio.");
        setLoading(false);
        return;
      }
      const response = await authService.login(body);
      setToken(response.accessToken);
      setUser(response.user);
      persistUser(response.user);
    } catch (err: unknown) {
      console.error("[clinicflow auth] login error", err);
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setError("No se ha podido conectar con el servidor.");
        } else if (err.status === 401) {
          setError("Credenciales incorrectas.");
        } else if (err.status === 403) {
          setError("No tienes permisos para acceder a este servicio.");
        } else {
          setError(err.message || "Error al iniciar sesión.");
        }
      } else if (err instanceof Error) {
        setError(err.message || "Error al iniciar sesión.");
      } else {
        setError("Error al iniciar sesión.");
      }
      setToken(null);
      setUser(null);
      setAuthToken(null);
      persistUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (body: RegisterRequest) => {
    setLoading(true);
    setError("");
    try {
      const apiKey = getServiceApiKey();

      if (!apiKey) {
        setError("Falta VITE_API_KEY para este servicio.");
        setLoading(false);
        return;
      }
      const response = await authService.register(body);
      setToken(response.accessToken);
      setUser(response.user);
      persistUser(response.user);
    } catch (err: unknown) {
      let message = "Error al registrarse.";
      if (err instanceof ApiError) {
        if (err.status === 0) {
          message = "No se ha podido conectar con el servidor.";
        } else if (err.status === 409) {
          message = "El email ya está registrado.";
        } else {
          message = err.message || "Error al registrarse.";
        }
      } else {
        message = "Error al registrarse.";
      }
      setError(message);
      setToken(null);
      setUser(null);
      setAuthToken(null);
      persistUser(null);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithProvider = async (provider: "google" | "facebook") => {
    if (typeof window === "undefined") return;
    setLoading(true);
    setError("");
    try {
      const tenantId = getTenantId();
      if (!tenantId) {
        throw new Error("Missing tenant");
      }
      const baseUrl = getApiBaseUrl();
      const origin = new URL(baseUrl).origin;
      const width = 520;
      const height = 640;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const url = `${baseUrl}/clinicflow/auth/${provider}?tenantId=${encodeURIComponent(
        tenantId,
      )}`;
      const popup = window.open(
        url,
        `clinicflow-${provider}`,
        `width=${width},height=${height},left=${left},top=${top}`,
      );
      if (!popup) {
        throw new Error("No se pudo abrir la ventana de acceso.");
      }

      await new Promise<void>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== origin) return;
          const payload = event.data;
          if (payload?.type === "clinicflow:auth-success") {
            const auth = payload.data;
            setAuthToken(auth.accessToken);
            setToken(auth.accessToken);
            setUser(auth.user);
            persistUser(auth.user);
            cleanup();
            resolve();
          }
          if (payload?.type === "clinicflow:auth-error") {
            const message = payload?.data?.message || "No se pudo autenticar.";
            cleanup();
            reject(new Error(message));
          }
        };

        const timer = window.setInterval(() => {
          if (popup.closed) {
            cleanup();
            reject(new Error("Ventana cerrada."));
          }
        }, 400);

        const cleanup = () => {
          window.removeEventListener("message", handleMessage);
          window.clearInterval(timer);
        };

        window.addEventListener("message", handleMessage);
      });
    } catch (err: any) {
      const message = err?.message || "No se pudo autenticar.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    persistUser(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleAuthExpired = () => {
      setError("La sesión ha expirado. Vuelve a iniciar sesión.");
      window.dispatchEvent(
        new CustomEvent("clinicflow:toast", {
          detail: {
            title: "Sesión caducada",
            message: "Tu sesión ha expirado. Vuelve a iniciar sesión.",
            variant: "warning",
          },
        }),
      );
      logout();
      window.history.replaceState(null, "", "/");
    };
    window.addEventListener("clinicflow:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("clinicflow:auth-expired", handleAuthExpired);
    };
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      register,
      loginWithProvider,
      logout,
    }),
    [user, token, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
