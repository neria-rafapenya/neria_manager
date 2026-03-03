import { getAdminToken, getApiBaseUrl, setAdminToken } from "../config/env";

class AdminApiError extends Error {
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

const requestAdminJson = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, credentials: "include" });
  } catch {
    throw new AdminApiError(0, url, "Error de red al conectar con el servidor.");
  }

  let payload: unknown = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload as any)?.message ||
      (payload as any)?.error ||
      `Error HTTP ${response.status}`;
    throw new AdminApiError(response.status, url, message, payload);
  }

  return payload as T;
};

export const adminApi = {
  async login(username: string, password: string) {
    const result = await requestAdminJson<{
      accessToken: string;
      expiresIn: number;
      mustChangePassword?: boolean;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setAdminToken(result.accessToken);
    return result;
  },
  logout() {
    setAdminToken(null);
  },
  listChatUsers: (tenantId: string) =>
    requestAdminJson<any[]>(`/tenants/${tenantId}/chat/users`),
  createChatUser: (tenantId: string, payload: any) =>
    requestAdminJson<any>(`/tenants/${tenantId}/chat/users`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateChatUser: (tenantId: string, id: string, payload: any) =>
    requestAdminJson<any>(`/tenants/${tenantId}/chat/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteChatUser: (tenantId: string, id: string) =>
    requestAdminJson<any>(`/tenants/${tenantId}/chat/users/${id}`, {
      method: "DELETE",
    }),
  listServiceUsers: (tenantId: string, serviceCode: string) =>
    requestAdminJson<any[]>(
      `/tenants/${tenantId}/services/${serviceCode}/users`,
    ),
  assignServiceUser: (tenantId: string, serviceCode: string, payload: any) =>
    requestAdminJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/users`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  updateServiceUser: (
    tenantId: string,
    serviceCode: string,
    userId: string,
    payload: any,
  ) =>
    requestAdminJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/users/${userId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    ),
  removeServiceUser: (tenantId: string, serviceCode: string, userId: string) =>
    requestAdminJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/users/${userId}`,
      { method: "DELETE" },
    ),
};
