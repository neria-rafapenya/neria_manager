const TOKEN_STORAGE_KEY = "clinicflow_auth_token";
const API_KEY_STORAGE_KEY = "clinicflow_api_key";
const TENANT_ID_STORAGE_KEY = "clinicflow_tenant_id";
const SERVICE_CODE_STORAGE_KEY = "clinicflow_service_code";
const SERVICE_ID_STORAGE_KEY = "clinicflow_service_id";
const ADMIN_TOKEN_STORAGE_KEY = "clinicflow_admin_token";

type ClinicflowEndpointKey =
  | "settings"
  | "services"
  | "protocols"
  | "faq"
  | "triage"
  | "reports";

type ClinicflowEndpoints = Record<ClinicflowEndpointKey, string>;

export type RuntimeEnv = Partial<Record<string, string>>;

const DEFAULT_CLINICFLOW_ENDPOINTS: ClinicflowEndpoints = {
  settings: "/clinicflow/settings",
  services: "/clinicflow/services",
  protocols: "/clinicflow/protocols",
  faq: "/clinicflow/faq",
  triage: "/clinicflow/triage",
  reports: "/clinicflow/reports",
};

let cachedClinicflowEndpoints: ClinicflowEndpoints | null = null;

const getRuntimeEnv = (): RuntimeEnv => {
  if (typeof window === "undefined") return {};
  return ((window as any).__ENV__ ?? {}) as RuntimeEnv;
};

const isPlaceholder = (value: string): boolean =>
  /^%VITE_[A-Z0-9_]+%$/.test(value.trim());

const sanitizeEnvValue = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || isPlaceholder(trimmed)) {
    return "";
  }
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unquoted = trimmed.slice(1, -1).trim();
    return isPlaceholder(unquoted) ? "" : unquoted;
  }
  return trimmed;
};

const readEnv = (key: string, fallback = ""): string => {
  const runtime = getRuntimeEnv();
  const fromRuntime = runtime[key];
  if (typeof fromRuntime === "string" && fromRuntime.length > 0) {
    const sanitized = sanitizeEnvValue(fromRuntime);
    if (sanitized) {
      return sanitized;
    }
  }
  const fromVite = (import.meta as any)?.env?.[key];
  if (typeof fromVite === "string" && fromVite.length > 0) {
    const sanitized = sanitizeEnvValue(fromVite);
    if (sanitized) {
      return sanitized;
    }
  }
  return fallback;
};

const localFallback = (): string => {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "";
};

const normalizeUrl = (value: string, fallback: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return fallback;
};

const readStorage = (key: string): string => {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

const writeStorage = (key: string, value: string | null): void => {
  if (typeof window === "undefined") return;
  try {
    if (!value) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
};

const parseClinicflowEndpoints = (): ClinicflowEndpoints => {
  if (cachedClinicflowEndpoints) return cachedClinicflowEndpoints;
  const raw = readEnv("VITE_CLINICFLOW_ENDPOINTS", "");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ClinicflowEndpoints>;
      cachedClinicflowEndpoints = {
        settings: parsed.settings || DEFAULT_CLINICFLOW_ENDPOINTS.settings,
        services: parsed.services || DEFAULT_CLINICFLOW_ENDPOINTS.services,
        protocols: parsed.protocols || DEFAULT_CLINICFLOW_ENDPOINTS.protocols,
        faq: parsed.faq || DEFAULT_CLINICFLOW_ENDPOINTS.faq,
        triage: parsed.triage || DEFAULT_CLINICFLOW_ENDPOINTS.triage,
        reports: parsed.reports || DEFAULT_CLINICFLOW_ENDPOINTS.reports,
      };
      return cachedClinicflowEndpoints;
    } catch {
      // fall through to defaults
    }
  }
  cachedClinicflowEndpoints = { ...DEFAULT_CLINICFLOW_ENDPOINTS };
  return cachedClinicflowEndpoints;
};

export const getApiBaseUrl = (): string =>
  normalizeUrl(readEnv("VITE_API_BASE_URL", ""), localFallback());

export const getClinicflowApiBaseUrl = (): string =>
  normalizeUrl(readEnv("VITE_CLINICFLOW_API_BASE_URL", ""), getApiBaseUrl());

export const getClinicflowEndpoint = (key: ClinicflowEndpointKey): string =>
  parseClinicflowEndpoints()[key];

export const getServiceApiKey = (): string =>
  readEnv("VITE_API_KEY", "") || readStorage(API_KEY_STORAGE_KEY);
export const getTenantId = (): string =>
  readEnv("VITE_TENANT_ID", "") || readStorage(TENANT_ID_STORAGE_KEY);
export const getServiceCode = (): string =>
  readEnv("VITE_SERVICE_CODE", "") || readStorage(SERVICE_CODE_STORAGE_KEY);
export const getServiceId = (): string =>
  readEnv("VITE_SERVICE_ID", "") || readStorage(SERVICE_ID_STORAGE_KEY);

export const setServiceApiKey = (value: string | null): void =>
  writeStorage(API_KEY_STORAGE_KEY, value);
export const setTenantId = (value: string | null): void =>
  writeStorage(TENANT_ID_STORAGE_KEY, value);
export const setServiceCode = (value: string | null): void =>
  writeStorage(SERVICE_CODE_STORAGE_KEY, value);
export const setServiceId = (value: string | null): void =>
  writeStorage(SERVICE_ID_STORAGE_KEY, value);

export const isAuthDebugEnabled = (): boolean =>
  readEnv("VITE_DEBUG_AUTH", "").toLowerCase() === "true";

export const getAdminToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAdminToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  try {
    if (!token) {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // ignore
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  try {
    if (!token) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } else {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // ignore
  }
};
