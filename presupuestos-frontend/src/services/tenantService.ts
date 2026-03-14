import { apiRequest } from "../api/client";
import { Tenant, TenantUpdateRequest } from "../types/tenant";

export const tenantService = {
  get: (tenantId: string) => apiRequest<Tenant>("/tenant", { tenantId }),
  update: (tenantId: string, payload: TenantUpdateRequest) =>
    apiRequest<Tenant>("/tenant/settings", {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
};
