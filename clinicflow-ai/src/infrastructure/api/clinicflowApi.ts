import { fetchWithAuth } from "./api";
import {
  getClinicflowApiBaseUrl,
  getApiBaseUrl,
  getClinicflowEndpoint,
  getServiceCode,
  getTenantId,
} from "../config/env";

const resolveContext = () => {
  const tenantId = getTenantId();
  const serviceCode = getServiceCode() || "clinicflow";
  if (!tenantId) {
    throw new Error("Missing tenant id");
  }
  if (!serviceCode) {
    throw new Error("Missing service code");
  }
  return { tenantId, serviceCode };
};

const withContextQuery = (path: string, tenantId: string, serviceCode: string): string => {
  const connector = path.includes("?") ? "&" : "?";
  return `${path}${connector}tenantId=${encodeURIComponent(
    tenantId,
  )}&serviceCode=${encodeURIComponent(serviceCode)}`;
};

const resolveEndpoint = (
  key: Parameters<typeof getClinicflowEndpoint>[0],
  tenantId: string,
  serviceCode: string,
  id?: string,
): string => {
  const base = getClinicflowEndpoint(key);
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const fullPath = id ? `${normalizedBase}/${id}` : normalizedBase;
  return withContextQuery(fullPath, tenantId, serviceCode);
};

const getClinicflowBaseUrl = (): string => getClinicflowApiBaseUrl();

export const clinicflowApi = {
  getSettings: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any>(resolveEndpoint("settings", tenantId, serviceCode), {
      baseUrl: getClinicflowBaseUrl(),
    });
  },
  updateSettings: (payload: any) => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any>(resolveEndpoint("settings", tenantId, serviceCode), {
      baseUrl: getClinicflowBaseUrl(),
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  listServices: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any[]>(resolveEndpoint("services", tenantId, serviceCode), {
      baseUrl: getClinicflowBaseUrl(),
    });
  },
  listProtocols: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any[]>(resolveEndpoint("protocols", tenantId, serviceCode), {
      baseUrl: getClinicflowBaseUrl(),
    });
  },
  listFaq: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any[]>(resolveEndpoint("faq", tenantId, serviceCode), {
      baseUrl: getClinicflowBaseUrl(),
    });
  },
  listTriage: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any[]>(resolveEndpoint("triage", tenantId, serviceCode), {
      baseUrl: getClinicflowBaseUrl(),
    });
  },
  listReports: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any[]>(resolveEndpoint("reports", tenantId, serviceCode), {
      baseUrl: getClinicflowBaseUrl(),
    });
  },
  listPatientInteractions: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/interactions", {
      baseUrl: getApiBaseUrl(),
    }),
};

export const patientApi = {
  summary: () =>
    fetchWithAuth<any>("/clinicflow/patient/summary", {
      baseUrl: getApiBaseUrl(),
    }),
  listAvailability: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    const path = `/clinicflow/patient/availability${query ? `?${query}` : ""}`;
    return fetchWithAuth<any[]>(path, { baseUrl: getApiBaseUrl() });
  },
  listAppointments: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/appointments", {
      baseUrl: getApiBaseUrl(),
    }),
  createAppointment: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/patient/appointments", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listDocuments: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/documents", {
      baseUrl: getApiBaseUrl(),
    }),
  listTreatments: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/treatments", {
      baseUrl: getApiBaseUrl(),
    }),
  listTreatmentReports: (treatmentId: string) =>
    fetchWithAuth<any[]>(
      `/clinicflow/patient/treatments/${treatmentId}/reports`,
      { baseUrl: getApiBaseUrl() },
    ),
  listInteractions: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/interactions", {
      baseUrl: getApiBaseUrl(),
    }),
  chatAvailability: (message: string) =>
    fetchWithAuth<any>("/clinicflow/patient/visits/chat", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  chatFaq: (message: string, history: { role: string; content: string }[]) =>
    fetchWithAuth<any>("/clinicflow/patient/faq/chat", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
  listFaqLogs: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/faq/logs", {
      baseUrl: getApiBaseUrl(),
    }),
  listFaqHandoffs: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/faq/handoffs", {
      baseUrl: getApiBaseUrl(),
    }),
  requestFaqHandoff: (messages: { role: string; content: string }[]) =>
    fetchWithAuth<any>("/clinicflow/patient/faq/handoff", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify({ messages }),
    }),
  getPreferences: () =>
    fetchWithAuth<any>("/clinicflow/patient/preferences", {
      baseUrl: getApiBaseUrl(),
    }),
  updatePreferences: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/patient/preferences", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getProfile: () =>
    fetchWithAuth<any>("/clinicflow/patient/profile", {
      baseUrl: getApiBaseUrl(),
    }),
  updateProfile: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/patient/profile", {
      baseUrl: getApiBaseUrl(),
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  changePassword: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/patient/password", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetchWithAuth<any>("/clinicflow/patient/avatar", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: form,
    });
  },
  createInteraction: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/patient/interactions", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  requestAppointmentChange: (appointmentId: string, message: string) =>
    fetchWithAuth<any>(`/clinicflow/patient/appointments/${appointmentId}/request-change`, {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  requestAppointmentCancel: (appointmentId: string, message: string) =>
    fetchWithAuth<any>(`/clinicflow/patient/appointments/${appointmentId}/request-cancel`, {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};

export const staffApi = {
  listPatients: () =>
    fetchWithAuth<any[]>("/clinicflow/staff/patients", {
      baseUrl: getApiBaseUrl(),
    }),
  searchPatients: (query: string) =>
    fetchWithAuth<any[]>(
      `/clinicflow/staff/patients/search?q=${encodeURIComponent(query)}`,
      { baseUrl: getApiBaseUrl() },
    ),
  listAvailability: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    const path = `/clinicflow/staff/availability${query ? `?${query}` : ""}`;
    return fetchWithAuth<any[]>(path, { baseUrl: getApiBaseUrl() });
  },
  createAvailability: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/staff/availability", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteAvailability: (id: string) =>
    fetchWithAuth<any>(`/clinicflow/staff/availability/${id}`, {
      baseUrl: getApiBaseUrl(),
      method: "DELETE",
    }),
  openAvailabilityWindow: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/staff/open-window", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listTimeOff: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    const path = `/clinicflow/staff/time-off${query ? `?${query}` : ""}`;
    return fetchWithAuth<any[]>(path, { baseUrl: getApiBaseUrl() });
  },
  listHolidays: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    const path = `/clinicflow/staff/holidays${query ? `?${query}` : ""}`;
    return fetchWithAuth<any[]>(path, { baseUrl: getApiBaseUrl() });
  },
  createHoliday: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/staff/holidays", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteHoliday: (id: string) =>
    fetchWithAuth<any>(`/clinicflow/staff/holidays/${id}`, {
      baseUrl: getApiBaseUrl(),
      method: "DELETE",
    }),
  createTimeOff: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/staff/time-off", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteTimeOff: (id: string) =>
    fetchWithAuth<any>(`/clinicflow/staff/time-off/${id}`, {
      baseUrl: getApiBaseUrl(),
      method: "DELETE",
    }),
  listAppointments: (patientUserId?: string) =>
    fetchWithAuth<any[]>(
      `/clinicflow/staff/appointments${patientUserId ? `?patientUserId=${encodeURIComponent(patientUserId)}` : ""}`,
      { baseUrl: getApiBaseUrl() },
    ),
  createAppointment: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/staff/appointments", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAppointment: (id: string, payload: any) =>
    fetchWithAuth<any>(`/clinicflow/staff/appointments/${id}`, {
      baseUrl: getApiBaseUrl(),
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteAppointment: (id: string) =>
    fetchWithAuth<any>(`/clinicflow/staff/appointments/${id}`, {
      baseUrl: getApiBaseUrl(),
      method: "DELETE",
    }),
  listDocuments: (patientUserId?: string) =>
    fetchWithAuth<any[]>(
      `/clinicflow/staff/documents${patientUserId ? `?patientUserId=${encodeURIComponent(patientUserId)}` : ""}`,
      { baseUrl: getApiBaseUrl() },
    ),
  createDocument: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/staff/documents", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  uploadDocument: (payload: {
    patientUserId: string;
    title?: string;
    category?: string;
    file: File;
  }) => {
    const form = new FormData();
    form.append("patientUserId", payload.patientUserId);
    if (payload.title) form.append("title", payload.title);
    if (payload.category) form.append("category", payload.category);
    form.append("file", payload.file);
    return fetchWithAuth<any>("/clinicflow/staff/documents/upload", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: form,
    });
  },
  updateDocument: (id: string, payload: any) =>
    fetchWithAuth<any>(`/clinicflow/staff/documents/${id}`, {
      baseUrl: getApiBaseUrl(),
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteDocument: (id: string) =>
    fetchWithAuth<any>(`/clinicflow/staff/documents/${id}`, {
      baseUrl: getApiBaseUrl(),
      method: "DELETE",
    }),
  listTreatments: (patientUserId?: string) =>
    fetchWithAuth<any[]>(
      `/clinicflow/staff/treatments${patientUserId ? `?patientUserId=${encodeURIComponent(patientUserId)}` : ""}`,
      { baseUrl: getApiBaseUrl() },
    ),
  createTreatment: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/staff/treatments", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listTreatmentReports: (treatmentId: string) =>
    fetchWithAuth<any[]>(
      `/clinicflow/staff/treatments/${treatmentId}/reports`,
      { baseUrl: getApiBaseUrl() },
    ),
  deleteTreatmentReport: (reportId: string) =>
    fetchWithAuth<void>(`/clinicflow/staff/treatments/reports/${reportId}`, {
      baseUrl: getApiBaseUrl(),
      method: "DELETE",
    }),
  updateTreatmentReport: (treatmentId: string, payload: any) =>
    fetchWithAuth<any>(`/clinicflow/staff/treatments/${treatmentId}/report`, {
      baseUrl: getApiBaseUrl(),
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  uploadTreatmentReport: (
    treatmentId: string,
    payload: { file: File; title?: string },
  ) => {
    const form = new FormData();
    form.append("file", payload.file);
    if (payload.title) form.append("title", payload.title);
    return fetchWithAuth<any>(`/clinicflow/staff/treatments/${treatmentId}/report-upload`, {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: form,
    });
  },
  updateTreatment: (id: string, payload: any) =>
    fetchWithAuth<any>(`/clinicflow/staff/treatments/${id}`, {
      baseUrl: getApiBaseUrl(),
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteTreatment: (id: string) =>
    fetchWithAuth<any>(`/clinicflow/staff/treatments/${id}`, {
      baseUrl: getApiBaseUrl(),
      method: "DELETE",
    }),
  listInteractions: (patientUserId?: string) =>
    fetchWithAuth<any[]>(
      `/clinicflow/staff/interactions${patientUserId ? `?patientUserId=${encodeURIComponent(patientUserId)}` : ""}`,
      { baseUrl: getApiBaseUrl() },
    ),
  createInteraction: (payload: any) =>
    fetchWithAuth<any>("/clinicflow/staff/interactions", {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getPrompt: (key: string) =>
    fetchWithAuth<any>(`/clinicflow/staff/prompts/${encodeURIComponent(key)}`, {
      baseUrl: getApiBaseUrl(),
    }),
  updatePrompt: (key: string, content: string) =>
    fetchWithAuth<any>(`/clinicflow/staff/prompts/${encodeURIComponent(key)}`, {
      baseUrl: getApiBaseUrl(),
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
  listFaqLogs: () =>
    fetchWithAuth<any[]>("/clinicflow/staff/faq/logs", {
      baseUrl: getApiBaseUrl(),
    }),
  listFaqHandoffs: () =>
    fetchWithAuth<any[]>("/clinicflow/staff/faq/handoffs", {
      baseUrl: getApiBaseUrl(),
    }),
  respondFaqHandoff: (id: string, responseText: string) =>
    fetchWithAuth<any>(`/clinicflow/staff/faq/handoffs/${id}/respond`, {
      baseUrl: getApiBaseUrl(),
      method: "POST",
      body: JSON.stringify({ responseText }),
    }),
};
