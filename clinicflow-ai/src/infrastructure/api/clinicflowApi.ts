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
  listAppointments: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/appointments", {
      baseUrl: getApiBaseUrl(),
    }),
  listDocuments: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/documents", {
      baseUrl: getApiBaseUrl(),
    }),
  listTreatments: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/treatments", {
      baseUrl: getApiBaseUrl(),
    }),
  listInteractions: () =>
    fetchWithAuth<any[]>("/clinicflow/patient/interactions", {
      baseUrl: getApiBaseUrl(),
    }),
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
};
