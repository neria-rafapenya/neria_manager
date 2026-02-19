// src/infrastructure/config/env.ts

const TOKEN_COOKIE_NAME = "ia_chat_access_token";
const TOKEN_STORAGE_KEY = "ia_chat_access_token";

const API_BASE_URL =
  import.meta.env.VITE_API_MANAGER ?? "http://localhost:3000";
const API_URL = import.meta.env.VITE_API_URL ?? API_BASE_URL;
const SERVICE_API_KEY = import.meta.env.VITE_API_KEY ?? "";
const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";
const SERVICE_CODE = import.meta.env.VITE_SERVICE_CODE ?? "";
const SERVICE_ID = import.meta.env.VITE_SERVICE_ID ?? "";
const PROVIDER_ID = import.meta.env.VITE_PROVIDER_ID ?? "";
const MODEL = import.meta.env.VITE_MODEL ?? "";
const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT ?? "persisted";

export const getApiBaseUrl = (): string => API_BASE_URL;
export const getApiUrl = (): string => API_URL;
export const getServiceApiKey = (): string => SERVICE_API_KEY;
export const getTenantId = (): string => TENANT_ID;
export const getServiceCode = (): string => SERVICE_CODE;
export const getServiceId = (): string => SERVICE_ID;
export const getProviderId = (): string => PROVIDER_ID;
export const getModel = (): string => MODEL;
export const getChatEndpoint = (): string => CHAT_ENDPOINT;

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
    // Borramos la cookie
    document.cookie = `${TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
    memoryToken = null;
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    return;
  }

  // Ajusta Max-Age a lo que tenga tu JWT (aquí 1h)
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
