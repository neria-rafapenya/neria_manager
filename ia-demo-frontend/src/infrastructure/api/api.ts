import {
  getApiBaseUrl,
  getAuthToken,
  getServiceApiKey,
  getTenantId,
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
  /**
   * Si es true, devolvemos el Response crudo (streaming, blobs, etc.)
   * sin intentar parsear JSON.
   */
  rawResponse?: boolean;
}

export async function fetchWithAuth<T = unknown>(
  path: string,
  options: FetchWithAuthOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  const token = getAuthToken();
  const apiKey = getServiceApiKey();
  const tenantId = getTenantId();

  const {
    headers: customHeaders,
    rawResponse = false,
    credentials = "omit",
    ...restOptions
  } = options;

  const isFormData =
    typeof FormData !== "undefined" && restOptions.body instanceof FormData;

  const headers: Record<string, string> = {
    // ⚠️ Importante: NO ponemos Content-Type si es FormData,
    // el navegador se encarga (boundary, etc.)
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
    headers["x-chat-token"] = token;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
      credentials,
    });
  } catch {
    // Error de red / CORS / servidor caído
    throw new ApiError(0, url, "Error de red al conectar con el servidor.");
  }

  // 🟢 CASO STREAMING / RAW → NO TOCAMOS EL BODY
  if (rawResponse) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        url,
        `Error HTTP ${response.status} al llamar a ${url}`
      );
    }
    return response as unknown as T;
  }

  // 🟢 204 No Content (por ejemplo DELETE)
  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        url,
        `Error HTTP ${response.status} al llamar a ${url}`
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
      `Error leyendo la respuesta de ${url}.`
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
        text
      );
    }
  }

  if (!response.ok) {
    const messageFromBody =
      (json as any)?.message ||
      (json as any)?.error ||
      `Error HTTP ${response.status} al llamar a ${url}`;

    throw new ApiError(response.status, url, messageFromBody, json);
  }

  return json as T;
}
