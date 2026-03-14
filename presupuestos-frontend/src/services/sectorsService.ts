import { apiRequest } from "../api/client";
import { Sector, SectorCreateRequest, SectorUpdateRequest } from "../types/sector";

export const sectorsService = {
  list: (tenantId: string, activeOnly = false) =>
    apiRequest<Sector[]>(`/sectors${activeOnly ? "?active=true" : ""}`, { tenantId }),
  create: (tenantId: string, payload: SectorCreateRequest) =>
    apiRequest<Sector>("/sectors", { method: "POST", tenantId, body: JSON.stringify(payload) }),
  update: (tenantId: string, id: string, payload: SectorUpdateRequest) =>
    apiRequest<Sector>(`/sectors/${id}`, { method: "PUT", tenantId, body: JSON.stringify(payload) }),
  remove: (tenantId: string, id: string) =>
    apiRequest<void>(`/sectors/${id}`, { method: "DELETE", tenantId }),
  testConnection: (tenantId: string, id: string) =>
    apiRequest<{ ok: boolean; status: number; message: string }>(`/sectors/${id}/test-connection`, {
      method: "POST",
      tenantId,
    }),
};
