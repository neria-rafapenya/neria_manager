import { apiRequest } from "../api/client";
import {
  OptionValue,
  OptionValueCreateRequest,
  OptionValueUpdateRequest,
  Product,
  ProductCreateRequest,
  ProductOption,
  ProductOptionCreateRequest,
  ProductOptionUpdateRequest,
  ProductUpdateRequest,
} from "../types/product";

export const productsService = {
  list: (tenantId: string) => apiRequest<Product[]>("/products", { tenantId }),
  create: (tenantId: string, payload: ProductCreateRequest) =>
    apiRequest<Product>("/products", {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  update: (tenantId: string, id: string, payload: ProductUpdateRequest) =>
    apiRequest<Product>(`/products/${id}`, {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
  remove: (tenantId: string, id: string) =>
    apiRequest<void>(`/products/${id}`, {
      method: "DELETE",
      tenantId,
    }),
  listOptions: (tenantId: string, productId: string) =>
    apiRequest<ProductOption[]>(`/products/${productId}/options`, { tenantId }),
  createOption: (tenantId: string, productId: string, payload: ProductOptionCreateRequest) =>
    apiRequest<ProductOption>(`/products/${productId}/options`, {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  updateOption: (tenantId: string, optionId: string, payload: ProductOptionUpdateRequest) =>
    apiRequest<ProductOption>(`/products/options/${optionId}`, {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
  removeOption: (tenantId: string, optionId: string) =>
    apiRequest<void>(`/products/options/${optionId}`, {
      method: "DELETE",
      tenantId,
    }),
  listOptionValues: (tenantId: string, optionId: string) =>
    apiRequest<OptionValue[]>(`/products/options/${optionId}/values`, { tenantId }),
  createOptionValue: (tenantId: string, optionId: string, payload: OptionValueCreateRequest) =>
    apiRequest<OptionValue>(`/products/options/${optionId}/values`, {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  updateOptionValue: (tenantId: string, valueId: string, payload: OptionValueUpdateRequest) =>
    apiRequest<OptionValue>(`/products/options/values/${valueId}`, {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
  removeOptionValue: (tenantId: string, valueId: string) =>
    apiRequest<void>(`/products/options/values/${valueId}`, {
      method: "DELETE",
      tenantId,
    }),
};
