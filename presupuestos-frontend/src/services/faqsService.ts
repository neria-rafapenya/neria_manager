import { apiRequest } from "../api/client";
import { Faq, FaqCreateRequest, FaqUpdateRequest } from "../types/faq";

export const faqsService = {
  list: (tenantId: string) => apiRequest<Faq[]>("/faqs", { tenantId }),
  create: (tenantId: string, payload: FaqCreateRequest) =>
    apiRequest<Faq>("/faqs", {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  update: (tenantId: string, id: string, payload: FaqUpdateRequest) =>
    apiRequest<Faq>(`/faqs/${id}`, {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
  remove: (tenantId: string, id: string) =>
    apiRequest<void>(`/faqs/${id}`, {
      method: "DELETE",
      tenantId,
    }),
};
