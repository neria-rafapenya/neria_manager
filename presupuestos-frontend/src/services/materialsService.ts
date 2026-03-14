import { apiRequest } from "../api/client";
import {
  Material,
  MaterialCreateRequest,
  MaterialUpdateRequest,
  ProductMaterialRule,
  ProductMaterialCreateRequest,
  ProductMaterialUpdateRequest,
} from "../types/material";

export const materialsService = {
  list: (tenantId: string, sectorId?: string) => {
    const query = sectorId ? `?sectorId=${encodeURIComponent(sectorId)}` : "";
    return apiRequest<Material[]>(`/materials${query}`, { tenantId });
  },
  create: (tenantId: string, payload: MaterialCreateRequest) =>
    apiRequest<Material>("/materials", {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  update: (tenantId: string, id: string, payload: MaterialUpdateRequest) =>
    apiRequest<Material>(`/materials/${id}`, {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
  remove: (tenantId: string, id: string) =>
    apiRequest<void>(`/materials/${id}`, { method: "DELETE", tenantId }),
  listProductRules: (tenantId: string, productId: string) =>
    apiRequest<ProductMaterialRule[]>(`/products/${productId}/materials`, {
      tenantId,
    }),
  createProductRule: (
    tenantId: string,
    productId: string,
    payload: ProductMaterialCreateRequest,
  ) =>
    apiRequest<ProductMaterialRule>(`/products/${productId}/materials`, {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  updateProductRule: (
    tenantId: string,
    ruleId: string,
    payload: ProductMaterialUpdateRequest,
  ) =>
    apiRequest<ProductMaterialRule>(`/product-materials/${ruleId}`, {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
  removeProductRule: (tenantId: string, ruleId: string) =>
    apiRequest<void>(`/product-materials/${ruleId}`, {
      method: "DELETE",
      tenantId,
    }),
};
