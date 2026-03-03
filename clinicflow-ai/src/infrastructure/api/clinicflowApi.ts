import { fetchWithAuth } from "./api";
import {
  getClinicflowApiBaseUrl,
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

const withContextQuery = (
  path: string,
  tenantId: string,
  serviceCode: string,
): string => {
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
    return fetchWithAuth<any>(
      resolveEndpoint("settings", tenantId, serviceCode),
      { baseUrl: getClinicflowBaseUrl() },
    );
  },
  updateSettings: (payload: any) => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any>(
      resolveEndpoint("settings", tenantId, serviceCode),
      {
        baseUrl: getClinicflowBaseUrl(),
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
  },
  listServices: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any[]>(
      resolveEndpoint("services", tenantId, serviceCode),
      { baseUrl: getClinicflowBaseUrl() },
    );
  },
  listProtocols: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any[]>(
      resolveEndpoint("protocols", tenantId, serviceCode),
      { baseUrl: getClinicflowBaseUrl() },
    );
  },
  listFaq: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any[]>(
      resolveEndpoint("faq", tenantId, serviceCode),
      { baseUrl: getClinicflowBaseUrl() },
    );
  },
  listTriage: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any[]>(
      resolveEndpoint("triage", tenantId, serviceCode),
      { baseUrl: getClinicflowBaseUrl() },
    );
  },
  listReports: () => {
    const { tenantId, serviceCode } = resolveContext();
    return fetchWithAuth<any[]>(
      resolveEndpoint("reports", tenantId, serviceCode),
      { baseUrl: getClinicflowBaseUrl() },
    );
  },
};
