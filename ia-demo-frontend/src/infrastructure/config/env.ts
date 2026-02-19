// src/infrastructure/config/env.ts

import { getRuntimeConfig } from "./runtimeConfig";

const TOKEN_COOKIE_NAME = "ia_chat_access_token";
const TOKEN_STORAGE_KEY = "ia_chat_access_token";

type RuntimeEnv = Partial<Record<string, string>>;

const getRuntimeEnv = (): RuntimeEnv => {
  if (typeof window === "undefined") return {};
  return ((window as any).__ENV__ ?? {}) as RuntimeEnv;
};

const sanitizeEnvValue = (value: string): string => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const readEnv = (key: string, fallback = ""): string => {
  const runtime = getRuntimeEnv();
  const fromRuntime = runtime[key];
  if (typeof fromRuntime === "string" && fromRuntime.length > 0) {
    return sanitizeEnvValue(fromRuntime);
  }

  const fromVite = (import.meta as any)?.env?.[key];
  if (typeof fromVite === "string" && fromVite.length > 0) {
    return sanitizeEnvValue(fromVite);
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

const readRuntimeString = (value?: string | null): string =>
  typeof value === "string" ? value.trim() : "";

export const getApiBaseUrl = (): string => {
  const runtime = getRuntimeConfig();
  const runtimeUrl =
    readRuntimeString(runtime?.apiBaseUrl) ||
    readRuntimeString(runtime?.apiUrl);
  if (runtimeUrl) {
    return normalizeUrl(runtimeUrl, localFallback());
  }
  return normalizeUrl(
    readEnv("VITE_API_BASE_URL", readEnv("VITE_API_MANAGER", "")),
    localFallback()
  );
};

export const getApiUrl = (): string =>
  normalizeUrl(readEnv("VITE_API_URL", ""), getApiBaseUrl());

export const getServiceApiKey = (): string => {
  const runtime = getRuntimeConfig();
  const runtimeKey = readRuntimeString(runtime?.apiKey);
  return runtimeKey || readEnv("VITE_API_KEY", "");
};

export const getTenantId = (): string => {
  const runtime = getRuntimeConfig();
  const runtimeValue = readRuntimeString(runtime?.tenantId);
  return runtimeValue || readEnv("VITE_TENANT_ID", "");
};

export const getServiceCode = (): string => {
  const runtime = getRuntimeConfig();
  const runtimeValue = readRuntimeString(runtime?.serviceCode);
  return runtimeValue || readEnv("VITE_SERVICE_CODE", "");
};

export const getServiceId = (): string => {
  const runtime = getRuntimeConfig();
  const runtimeValue = readRuntimeString(runtime?.serviceId);
  return runtimeValue || readEnv("VITE_SERVICE_ID", "");
};

export const getProviderId = (): string => {
  const runtime = getRuntimeConfig();
  const runtimeValue = readRuntimeString(runtime?.providerId);
  return runtimeValue || readEnv("VITE_PROVIDER_ID", "");
};

export const getModel = (): string => {
  const runtime = getRuntimeConfig();
  const runtimeValue = readRuntimeString(runtime?.model);
  return runtimeValue || readEnv("VITE_MODEL", "");
};

export const getChatEndpoint = (): string => {
  const runtime = getRuntimeConfig();
  const runtimeValue = readRuntimeString(runtime?.chatEndpoint);
  return runtimeValue || readEnv("VITE_CHAT_ENDPOINT", "persisted");
};

export type ServiceMode = "chat" | "email" | "financial" | "self-assessment";

export const getServiceMode = (): ServiceMode => {
  const runtime = getRuntimeConfig();
  const runtimeMode =
    readRuntimeString(runtime?.serviceMode) || readRuntimeString(runtime?.mode);
  const normalizedRuntime = runtimeMode.toLowerCase();
  if (normalizedRuntime === "email") return "email";
  if (["financial", "finance", "simulador-financiero"].includes(normalizedRuntime)) {
    return "financial";
  }

  const raw = readEnv("VITE_SERVICE_MODE", "").trim().toLowerCase();
  if (raw === "email") return "email";
  if (["financial", "finance", "simulador-financiero"].includes(raw)) return "financial";
  return "chat";
};

const isBrowser = (): boolean => typeof document !== "undefined";

let memoryToken: string | null = null;

const readTokenFromCookie = (): string | null => {
  if (!isBrowser()) return memoryToken;

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${TOKEN_COOKIE_NAME}=([^;]*)`)
  );

  return match ? decodeURIComponent(match[1]) : null;
};

const readTokenFromStorage = (): string | null => {
  if (!isBrowser()) return memoryToken;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const getAuthToken = (): string | null => {
  if (!isBrowser()) {
    return memoryToken;
  }
  return readTokenFromCookie() ?? readTokenFromStorage();
};

export const setAuthToken = (token: string | null): void => {
  if (!isBrowser()) {
    memoryToken = token;
    return;
  }

  if (!token) {
    document.cookie = `${TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
    memoryToken = null;
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    return;
  }

  const maxAgeSeconds = 60 * 60;

  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;

  memoryToken = token;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // ignore
  }
};
