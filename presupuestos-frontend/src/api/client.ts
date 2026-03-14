import { clearSession, getAccessToken, isTokenExpired, loadSession, markSessionExpired } from "../services/session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081";

export interface ApiRequestOptions extends RequestInit {
  tenantId?: string;
  token?: string;
  requestName?: string;
  skipContentType?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!options.skipContentType && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let tenantId = options.tenantId;
  let token = options.token;
  if (!tenantId || !token) {
    const session = loadSession();
    tenantId = tenantId ?? session?.tenant?.id;
    token = token ?? session?.token ?? getAccessToken();
  }

  if (tenantId) {
    headers.set("X-Tenant-Id", tenantId);
  }

  const isAuthPath = path.startsWith("/auth/");

  if (token && !isAuthPath) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!isAuthPath && token && isTokenExpired(token)) {
    markSessionExpired();
    clearSession();
    if (window.location.pathname !== "/auth") {
      window.location.assign("/auth");
    }
    throw new Error("");
  }

  const method = (options.method ?? "GET").toString().toUpperCase();
  const cleanPath = path.split("?")[0] ?? "";
  const slug = cleanPath.replace(/^\//, "").replace(/[/{}/]/g, "_") || "root";
  const requestName = options.requestName ?? `${method}_${slug}`;
  const separator = path.includes("?") ? "&" : "?";
  const url = `${API_BASE_URL}${path}${separator}req=REQ_${requestName}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && !isAuthPath) {
    markSessionExpired();
    clearSession();
    if (window.location.pathname !== "/auth") {
      window.location.assign("/auth");
    }
    throw new Error("");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
