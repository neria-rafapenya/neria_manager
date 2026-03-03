import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, LoginRequest } from "../../core/domain/auth";
import { AuthService } from "../../core/application/services/AuthService";
import { AuthRepository } from "../repositories/AuthRepository";
import { ApiError } from "../api/api";
import {
  getApiBaseUrl,
  getAuthToken,
  getServiceApiKey,
  getServiceCode,
  getServiceId,
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
      const serviceCode = getServiceCode();
      const serviceId = getServiceId();
      const tenantId = getTenantId();

      if (isAuthDebugEnabled()) {
        console.info("[clinicflow auth] env", {
          apiBaseUrl: getApiBaseUrl(),
          tenantId,
          serviceCode,
          serviceId,
          apiKey: maskSecret(apiKey),
        });
      }

      if (!apiKey) {
        setError("Falta VITE_API_KEY para este servicio.");
        setLoading(false);
        return;
      }
      if (!serviceCode && !serviceId && !body.serviceCode && !body.tenantServiceId) {
        setError("Falta VITE_SERVICE_CODE o VITE_SERVICE_ID.");
        setLoading(false);
        return;
      }

      const payload = {
        ...body,
        serviceCode: body.serviceCode || serviceCode,
        tenantServiceId: body.tenantServiceId || serviceId,
      } as LoginRequest;
      const response = await authService.login(payload);
      setToken(response.accessToken);
      setUser(response.user);
      persistUser(response.user);
    } catch (err: unknown) {
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

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    persistUser(null);
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
    [user, token, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
