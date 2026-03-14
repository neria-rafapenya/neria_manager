import { apiRequest } from "../api/client";
import { Customer, CustomerCreateRequest, CustomerUpdateRequest } from "../types/customer";

export const customersService = {
  list: (tenantId: string) => apiRequest<Customer[]>("/customers", { tenantId }),
  create: (tenantId: string, payload: CustomerCreateRequest) =>
    apiRequest<Customer>("/customers", {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  update: (tenantId: string, id: string, payload: CustomerUpdateRequest) =>
    apiRequest<Customer>(`/customers/${id}`, {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
};
