import { getStoredLanguage, translate } from "./i18n";

const fallbackBaseUrl =
  import.meta.env.MODE === "production"
    ? "https://backend-production-fc6a.up.railway.app"
    : "http://localhost:3000";
let baseUrl = import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl;
if (import.meta.env.MODE === "production" && baseUrl.includes("localhost")) {
  baseUrl = "https://backend-production-fc6a.up.railway.app";
}
const apiKey = import.meta.env.VITE_API_KEY || "";
const authTokenFallback = import.meta.env.VITE_AUTH_TOKEN || "";
const AUTH_TOKEN_KEY = "pm_auth_token";
const refreshClientId = import.meta.env.VITE_AUTH_CLIENT_ID || "";
const refreshClientSecret = import.meta.env.VITE_AUTH_CLIENT_SECRET || "";
const t = (key: string, vars?: Record<string, string | number>) =>
  translate(getStoredLanguage(), key, vars);

const canRefresh = Boolean(refreshClientId && refreshClientSecret);
let authModalPromise: Promise<void> | null = null;

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};

const normalizeHeaders = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers;
};

const clearCookie = (name: string) => {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
};

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return authTokenFallback || "";
  }
  const stored = window.localStorage?.getItem(AUTH_TOKEN_KEY);
  return stored || authTokenFallback || "";
};

const setStoredToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage?.setItem(AUTH_TOKEN_KEY, token);
};

const clearStoredToken = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage?.removeItem(AUTH_TOKEN_KEY);
};

const showSessionExpiredModal = async () => {
  if (typeof window === "undefined") {
    return;
  }
  if (authModalPromise) {
    return authModalPromise;
  }
  authModalPromise = (async () => {
    clearCookie("pm_auth_user");
    clearStoredToken();
    fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: getStoredToken()
        ? { Authorization: `Bearer ${getStoredToken()}` }
        : undefined,
    }).catch(() => undefined);
    window.location.href = "/login";
  })();
  return authModalPromise;
};

async function refreshToken() {
  if (!canRefresh) {
    return null;
  }
  const authToken = getStoredToken();
  const response = await fetch(`${baseUrl}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({
      clientId: refreshClientId,
      clientSecret: refreshClientSecret,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { accessToken: string };
  if (data?.accessToken) {
    setStoredToken(data.accessToken);
  }
  return data.accessToken;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  retry = true,
): Promise<T> {
  const authToken = getStoredToken();
  const mergedHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...normalizeHeaders(init?.headers),
  };
  if (authToken) {
    mergedHeaders.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: mergedHeaders,
  });

  if (response.status === 401) {
    if (retry && canRefresh) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return requestJson<T>(path, init, false);
      }
    }
    if (typeof window !== "undefined" && authToken) {
      await showSessionExpiredModal();
    }
    throw new Error(t("Sesión expirada. Vuelve a iniciar sesión."));
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `API error ${response.status}`;
    try {
      const data = JSON.parse(text) as { message?: string; error?: string };
      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else if (text) {
        message = text;
      }
    } catch (error) {
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error("Invalid JSON response");
  }
}


async function requestForm<T>(
  path: string,
  form: FormData,
  init?: RequestInit,
  retry = true,
): Promise<T> {
  const authToken = getStoredToken();
  const mergedHeaders: Record<string, string> = {
    ...normalizeHeaders(init?.headers),
  };
  if (authToken) {
    mergedHeaders.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    method: init?.method || "POST",
    credentials: "include",
    headers: mergedHeaders,
    body: form,
  });

  if (response.status === 401) {
    if (retry && canRefresh) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return requestForm<T>(path, form, init, false);
      }
    }
    if (typeof window !== "undefined" && authToken) {
      await showSessionExpiredModal();
    }
    throw new Error(t("Sesión expirada. Vuelve a iniciar sesión."));
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `API error ${response.status}`;
    try {
      const data = JSON.parse(text) as { message?: string; error?: string };
      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else if (text) {
        message = text;
      }
    } catch (error) {
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error("Invalid JSON response");
  }
}

async function requestJsonPublic<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const mergedHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...normalizeHeaders(init?.headers),
  };
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "omit",
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error("Invalid JSON response");
  }
}



export const api = {
  issueToken: (payload: { clientId: string; clientSecret: string }) =>
    requestJson<{ accessToken: string; expiresIn: number }>("/auth/token", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getTenants: () => requestJson<any[]>("/tenants"),
  createTenant: (payload: any) =>
    requestJson<any>("/tenants", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTenant: (id: string, payload: any) =>
    requestJson<any>(`/tenants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  updateTenantSelf: (payload: any) =>
    requestJson<any>(`/tenants/me`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  toggleTenantKillSwitch: (id: string, enabled: boolean) =>
    requestJson<any>(`/tenants/${id}/kill-switch`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  getProviders: (tenantId: string) =>
    requestJson<any[]>("/providers", {
      headers: {
        "x-tenant-id": tenantId,
      },
    }),
  createProvider: (tenantId: string, payload: any) =>
    requestJson<any>("/providers", {
      method: "POST",
      headers: {
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(payload),
    }),
  updateProvider: (tenantId: string, id: string, payload: any) =>
    requestJson<any>(`/providers/${id}`, {
      method: "PATCH",
      headers: {
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(payload),
    }),
  getPolicy: (tenantId: string) =>
    requestJson<any>("/policies", {
      headers: {
        "x-tenant-id": tenantId,
      },
    }),
  upsertPolicy: (tenantId: string, payload: any) =>
    requestJson<any>("/policies", {
      method: "PUT",
      headers: {
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(payload),
    }),
  listPolicies: () => requestJson<any[]>("/policies/admin"),
  deletePolicy: (tenantId: string) =>
    requestJson<any>(`/policies/${tenantId}`, {
      method: "DELETE",
    }),
  getUsageSummary: (tenantId: string) =>
    requestJson<any>(`/usage/summary?tenantId=${tenantId}`),
  getUsageSummaryAll: async () => {
    const result = await requestJson<any>(`/usage/summary`);
    if (Array.isArray(result)) {
      return result;
    }
    if (!result) {
      return [];
    }
    return [result];
  },
  getUsageAlerts: (tenantId: string) =>
    requestJson<any[]>(`/usage/alerts?tenantId=${tenantId}`),
  getUsageAlertsAll: () => requestJson<any[]>(`/usage/alerts`),
  getUsageEvents: (tenantId: string, limit = 20) =>
    requestJson<any[]>(`/usage/events?tenantId=${tenantId}&limit=${limit}`),
  getUsageEventsAll: (limit = 20) =>
    requestJson<any[]>(`/usage/events?limit=${limit}`),
  notifyAlerts: (tenantId: string) =>
    requestJson<any>("/usage/alerts/notify", {
      method: "POST",
      body: JSON.stringify({ tenantId }),
    }),
  getAudit: (limit = 5, tenantId?: string) =>
    requestJson<any[]>(
      tenantId
        ? `/audit?limit=${limit}&tenantId=${tenantId}`
        : `/audit?limit=${limit}`,
    ),
  getLogs: (limit = 200, tenantId?: string, type?: string, query?: string) => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (tenantId) params.set("tenantId", tenantId);
    if (type) params.set("type", type);
    if (query) params.set("q", query);
    return requestJson<any[]>(`/logs?${params.toString()}`);
  },
  getPricing: () => requestJson<any[]>("/pricing"),
  createPricing: (payload: any) =>
    requestJson<any>("/pricing", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePricing: (id: string, payload: any) =>
    requestJson<any>(`/pricing/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getWebhooks: () => requestJson<any[]>("/webhooks"),
  createWebhook: (payload: any) =>
    requestJson<any>("/webhooks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateWebhook: (id: string, payload: any) =>
    requestJson<any>(`/webhooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getNotifications: () => requestJson<any[]>("/notifications"),
  createNotification: (payload: any) =>
    requestJson<any>("/notifications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateNotification: (id: string, payload: any) =>
    requestJson<any>(`/notifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  seedDemo: () => requestJson<any>("/seed/demo", { method: "POST" }),
  getAlertSchedule: () => requestJson<any>("/settings/alerts-schedule"),
  updateAlertSchedule: (payload: any) =>
    requestJson<any>("/settings/alerts-schedule", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getDebugMode: () => requestJson<any>("/settings/debug-mode"),
  setDebugMode: (enabled: boolean) =>
    requestJson<any>("/settings/debug-mode", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  purgeDebug: (resources: string[]) =>
    requestJson<any>("/settings/debug/purge", {
      method: "POST",
      body: JSON.stringify({ resources }),
    }),
  listApiKeys: () => requestJson<any>("/auth/api-keys"),
  createApiKey: (payload: any) =>
    requestJson<any>("/auth/api-keys", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  revokeApiKey: (id: string) =>
    requestJson<any>(`/auth/api-keys/${id}/revoke`, {
      method: "PATCH",
    }),
  rotateApiKey: (id: string) =>
    requestJson<any>(`/auth/api-keys/${id}/rotate`, {
      method: "PATCH",
    }),
  getTenantServices: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/services`),
  updateTenantServiceConfig: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/config`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getTenantServiceJira: (tenantId: string, serviceCode: string) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/jira`),
  updateTenantServiceJira: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/jira`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listTenantServiceEmailAccounts: (tenantId: string, serviceCode: string) =>
    requestJson<any[]>(
      `/tenants/${tenantId}/services/${serviceCode}/email/accounts`,
    ),
  createTenantServiceEmailAccount: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/email/accounts`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  updateTenantServiceEmailAccount: (
    tenantId: string,
    serviceCode: string,
    accountId: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/email/accounts/${accountId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  deleteTenantServiceEmailAccount: (
    tenantId: string,
    serviceCode: string,
    accountId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/email/accounts/${accountId}`,
      {
        method: "DELETE",
      },
    ),
  listTenantServiceEmailMessages: (
    tenantId: string,
    serviceCode: string,
    limit = 50,
  ) =>
    requestJson<any[]>(
      `/tenants/${tenantId}/services/${serviceCode}/email/messages?limit=${limit}`,
    ),
  syncTenantServiceEmail: (tenantId: string, serviceCode: string) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/email/sync`,
      {
        method: "POST",
      },
    ),

  listTenantServiceSurveys: (tenantId: string, serviceCode: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/services/${serviceCode}/surveys`),
  listTenantServiceSurveysExternal: (tenantId: string, serviceCode: string) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/external`,
    ),
  getTenantServiceSurvey: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}`,
    ),
  createTenantServiceSurvey: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/surveys`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTenantServiceSurvey: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  deleteTenantServiceSurvey: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}`,
      { method: "DELETE" },
    ),
  createTenantServiceSurveyQuestion: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}/questions`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  updateTenantServiceSurveyQuestion: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
    questionId: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}/questions/${questionId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    ),
  deleteTenantServiceSurveyQuestion: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
    questionId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}/questions/${questionId}`,
      { method: "DELETE" },
    ),
  listTenantServiceSurveyResponses: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}/responses`,
    ),
  listTenantServiceSurveyResponsesExternal: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}/responses/external`,
    ),
  getTenantServiceSurveyResponse: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
    responseId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}/responses/${responseId}`,
    ),
  exportTenantServiceSurveyResponses: async (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
  ) => {
    const authToken = getStoredToken();
    const response = await fetch(
      `${baseUrl}/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}/responses/export`,
      {
        method: "GET",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        credentials: "include",
      },
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }
    return response.blob();
  },
  listTenantServiceSurveyInsights: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}/insights`,
    ),
  runTenantServiceSurveyInsights: (
    tenantId: string,
    serviceCode: string,
    surveyId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/surveys/${surveyId}/insights`,
      { method: "POST" },
    ),

  listTenantServiceFinancialSimulations: (tenantId: string, serviceCode: string) =>
    requestJson<any[]>(
      `/tenants/${tenantId}/services/${serviceCode}/financial-simulations`,
    ),
  createTenantServiceFinancialSimulation: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/financial-simulations`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  getTenantServiceFinancialSimulation: (
    tenantId: string,
    serviceCode: string,
    simulationId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/financial-simulations/${simulationId}`,
    ),

  listTenantServiceSelfAssessments: (tenantId: string, serviceCode: string) =>
    requestJson<any[]>(
      `/tenants/${tenantId}/services/${serviceCode}/self-assessments`,
    ),
  createTenantServiceSelfAssessment: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/self-assessments`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  getTenantServiceSelfAssessment: (
    tenantId: string,
    serviceCode: string,
    assessmentId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/self-assessments/${assessmentId}`,
    ),
  listTenantServicePreEvaluations: (tenantId: string, serviceCode: string) =>
    requestJson<any[]>(
      `/tenants/${tenantId}/services/${serviceCode}/pre-evaluations`,
    ),
  createTenantServicePreEvaluation: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/pre-evaluations`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  getTenantServicePreEvaluation: (
    tenantId: string,
    serviceCode: string,
    evaluationId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/pre-evaluations/${evaluationId}`,
    ),

  listTenantServiceOperationalSupport: (tenantId: string, serviceCode: string) =>
    requestJson<any[]>(
      `/tenants/${tenantId}/services/${serviceCode}/operational-support`,
    ),
  createTenantServiceOperationalSupport: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/operational-support`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  getTenantServiceOperationalSupport: (
    tenantId: string,
    serviceCode: string,
    entryId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/operational-support/${entryId}`,
    ),

  publicGetSurvey: (publicCode: string) =>
    requestJsonPublic<any>(`/public/surveys/${publicCode}`),
  publicSubmitSurvey: (publicCode: string, payload: any) =>
    requestJsonPublic<any>(`/public/surveys/${publicCode}/responses`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listTenantServiceEndpoints: (tenantId: string, serviceCode: string) =>
    requestJson<any[]>(
      `/tenants/${tenantId}/services/${serviceCode}/endpoints`,
    ),
  createTenantServiceEndpoint: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/endpoints`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTenantServiceEndpoint: (
    tenantId: string,
    serviceCode: string,
    id: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/endpoints/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  deleteTenantServiceEndpoint: (
    tenantId: string,
    serviceCode: string,
    id: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/endpoints/${id}`,
      {
        method: "DELETE",
      },
    ),
  listTenantServiceUsers: (tenantId: string, serviceCode: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/services/${serviceCode}/users`),
  assignTenantServiceUser: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/users`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTenantServiceUser: (
    tenantId: string,
    serviceCode: string,
    userId: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/users/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),
  removeTenantServiceUser: (
    tenantId: string,
    serviceCode: string,
    userId: string,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/services/${serviceCode}/users/${userId}`,
      {
        method: "DELETE",
      },
    ),
  getTenantServiceStorage: (tenantId: string, serviceCode: string) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/storage`),
  updateTenantServiceStorage: (
    tenantId: string,
    serviceCode: string,
    payload: any,
  ) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/storage`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteTenantServiceStorage: (tenantId: string, serviceCode: string) =>
    requestJson<any>(`/tenants/${tenantId}/services/${serviceCode}/storage`, {
      method: "DELETE",
    }),
  getTenantPricing: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/pricing`),
  updateTenantPricing: (tenantId: string, payload?: any) =>
    requestJson<any>(`/tenants/${tenantId}/pricing`, {
      method: "PUT",
      body: JSON.stringify(payload ?? { pricingIds: [] }),
    }),
  listChatUsers: (tenantId: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/chat/users`),
  createChatUser: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/chat/users`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateChatUser: (tenantId: string, id: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/chat/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteChatUser: (tenantId: string, id: string) =>
    requestJson<any>(`/tenants/${tenantId}/chat/users/${id}`, {
      method: "DELETE",
    }),
  listChatConversations: (tenantId: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/chat/conversations`),
  listChatMessages: (tenantId: string, conversationId: string) =>
    requestJson<any[]>(
      `/tenants/${tenantId}/chat/conversations/${conversationId}/messages`,
    ),
  listChatHandoffs: (tenantId: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/chat/handoffs`),
  acceptChatHandoff: (tenantId: string, conversationId: string) =>
    requestJson<any>(
      `/tenants/${tenantId}/chat/conversations/${conversationId}/handoff/accept`,
      { method: "POST" },
    ),
  resolveChatHandoff: (tenantId: string, conversationId: string) =>
    requestJson<any>(
      `/tenants/${tenantId}/chat/conversations/${conversationId}/handoff/resolve`,
      { method: "POST" },
    ),
  addHumanChatMessage: (
    tenantId: string,
    conversationId: string,
    payload: any,
  ) =>
    requestJson<any>(
      `/tenants/${tenantId}/chat/conversations/${conversationId}/messages/human`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  deleteChatConversation: (tenantId: string, conversationId: string) =>
    requestJson<any>(
      `/tenants/${tenantId}/chat/conversations/${conversationId}`,
      {
        method: "DELETE",
      },
    ),
  listServiceCatalog: () => requestJson<any[]>("/services/catalog"),
  createServiceCatalog: (payload: any) =>
    requestJson<any>("/services/catalog", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateServiceCatalog: (id: string, payload: any) =>
    requestJson<any>(`/services/catalog/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteServiceCatalog: (id: string) =>
    requestJson<any>(`/services/catalog/${id}`, {
      method: "DELETE",
    }),
  getTenantSubscription: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`),
  getTenantInvoices: (tenantId: string) =>
    requestJson<any[]>(`/tenants/${tenantId}/invoices`),
  createTenantSubscription: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTenantSubscription: (tenantId: string, payload: any) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createStripePortalSession: (tenantId: string) =>
    requestJson<{ url: string }>(`/tenants/${tenantId}/subscription/portal`, {
      method: "POST",
    }),
  deleteTenantServiceAssignment: (tenantId: string, tenantServiceId: string) =>
    requestJson<any>(
      `/tenants/${tenantId}/subscription/services/${tenantServiceId}`,
      {
        method: "DELETE",
      },
    ),
  deleteTenantSubscription: (tenantId: string) =>
    requestJson<any>(`/tenants/${tenantId}/subscription`, {
      method: "DELETE",
    }),
  listAdminSubscriptions: () => requestJson<any[]>("/admin/subscriptions"),
  approveSubscriptionPayment: (tenantId: string) =>
    requestJson<any>(`/admin/subscriptions/${tenantId}/approve`, {
      method: "POST",
    }),
  confirmSubscriptionPayment: (token: string) =>
    requestJson<any>("/billing/confirm", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  confirmStripePayment: (sessionId: string) =>
    requestJson<any>("/billing/stripe/confirm", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),
  getGlobalKillSwitch: () => requestJson<any>("/settings/kill-switch"),
  setGlobalKillSwitch: (enabled: boolean) =>
    requestJson<any>("/settings/kill-switch", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  executeRuntime: (tenantId: string, payload: any) =>
    requestJson<any>("/runtime/execute", {
      method: "POST",
      headers: {
        "x-tenant-id": tenantId,
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify(payload),
    }),
  getProfile: () => requestJson<any>("/auth/profile"),
  updateProfile: (payload: any) =>
    requestJson<any>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  uploadProfileAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestForm<any>("/auth/profile/avatar", form);
  },
  forgotPassword: (identifier: string) =>
    requestJson<any>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),
  resetPassword: (payload: { token: string; password: string }) =>
    requestJson<any>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listAdminUsers: () => requestJson<any[]>("/admin/users"),
  createAdminUser: (payload: any) =>
    requestJson<any>("/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAdminUser: (id: string, payload: any) =>
    requestJson<any>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteAdminUser: (id: string) =>
    requestJson<any>(`/admin/users/${id}`, {
      method: "DELETE",
    }),
  getDocs: (menuSlug: string) =>
    requestJson<any[]>(
      `/docs?menuSlug=${encodeURIComponent(menuSlug)}&enabled=true`,
    ),
  listDocs: (filters: {
    menuSlug?: string;
    category?: string;
    enabled?: boolean;
    q?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.menuSlug) {
      params.set("menuSlug", filters.menuSlug);
    }
    if (filters.category) {
      params.set("category", filters.category);
    }
    if (typeof filters.enabled === "boolean") {
      params.set("enabled", String(filters.enabled));
    }
    if (filters.q) {
      params.set("q", filters.q);
    }
    const query = params.toString();
    return requestJson<any[]>(`/docs${query ? `?${query}` : ""}`);
  },
  getDocById: (id: string) => requestJson<any>(`/docs/${id}`),
  createDoc: (payload: any) =>
    requestJson<any>("/docs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDoc: (id: string, payload: any) =>
    requestJson<any>(`/docs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteDoc: (id: string) =>
    requestJson<any>(`/docs/${id}`, {
      method: "DELETE",
    }),
};
