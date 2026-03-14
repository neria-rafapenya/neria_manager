import { apiRequest } from "../api/client";
import { AiProfile } from "../types/ai";

export interface AiProfilePayload {
  sectorId?: string;
  productId?: string;
  requiredOptionNames?: string[];
  promptInstructions?: string;
  quantityLabel?: string;
  active?: boolean;
}

export const aiProfileService = {
  list: (tenantId: string) => apiRequest<AiProfile[]>("/ai/profiles", { tenantId }),
  resolve: (tenantId: string, sectorId?: string, productId?: string) => {
    const params = new URLSearchParams();
    if (sectorId) params.set("sectorId", sectorId);
    if (productId) params.set("productId", productId);
    const suffix = params.toString();
    const path = `/ai/profiles/resolve${suffix ? `?${suffix}` : ""}`;
    return apiRequest<AiProfile | undefined>(path, { tenantId });
  },
  create: (tenantId: string, payload: AiProfilePayload) =>
    apiRequest<AiProfile>("/ai/profiles", {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  update: (tenantId: string, id: string, payload: AiProfilePayload) =>
    apiRequest<AiProfile>(`/ai/profiles/${id}`, {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
  remove: (tenantId: string, id: string) =>
    apiRequest<void>(`/ai/profiles/${id}`, { method: "DELETE", tenantId }),
};
