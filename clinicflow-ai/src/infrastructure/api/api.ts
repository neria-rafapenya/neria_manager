import {
  getApiBaseUrl,
  getAuthToken,
  getServiceApiKey,
  getTenantId,
  setAuthToken,
} from "../config/env";

export class ApiError extends Error {
  status: number;
  url: string;
  body?: unknown;

  constructor(status: number, url: string, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export interface FetchWithAuthOptions extends RequestInit {
  rawResponse?: boolean;
  baseUrl?: string;
}

const joinUrl = (baseUrl: string, path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  if (!baseUrl) return path;
  const needsSlash = !baseUrl.endsWith("/") && !path.startsWith("/");
  const dropSlash = baseUrl.endsWith("/") && path.startsWith("/");
  if (needsSlash) return `${baseUrl}/${path}`;
  if (dropSlash) return `${baseUrl.slice(0, -1)}${path}`;
  return `${baseUrl}${path}`;
};

export async function fetchWithAuth<T = unknown>(
  path: string,
  options: FetchWithAuthOptions = {},
): Promise<T> {
  const baseUrl = options.baseUrl ?? getApiBaseUrl();
  const url = joinUrl(baseUrl, path);
  const token = getAuthToken();
  const apiKey = getServiceApiKey();
  const tenantId = getTenantId();

  const {
    headers: customHeaders,
    rawResponse = false,
    credentials = "omit",
    baseUrl: _ignoredBaseUrl,
    ...restOptions
  } = options;

  const isFormData =
    typeof FormData !== "undefined" && restOptions.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(customHeaders as Record<string, string> | undefined),
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  if (tenantId) {
    headers["x-tenant-id"] = tenantId;
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
      credentials,
    });
  } catch {
    throw new ApiError(0, url, "Error de red al conectar con el servidor.");
  }

  if (rawResponse) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        url,
        `Error HTTP ${response.status} al llamar a ${url}`,
      );
    }
    return response as unknown as T;
  }

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        url,
        `Error HTTP ${response.status} al llamar a ${url}`,
      );
    }
    return null as T;
  }

  let text: string;
  try {
    text = await response.text();
  } catch {
    throw new ApiError(
      response.status,
      url,
      `Error leyendo la respuesta de ${url}.`,
    );
  }

  let json: unknown = null;
  if (text && text.length > 0) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new ApiError(
        response.status,
        url,
        `Error parseando JSON de la respuesta de ${url}.`,
        text,
      );
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("clinicflow:auth-expired"));
      }
    }
    const messageFromBody =
      (json as any)?.message ||
      (json as any)?.error ||
      `Error HTTP ${response.status}`;
    throw new ApiError(response.status, url, messageFromBody, json);
  }

  return json as T;
}
