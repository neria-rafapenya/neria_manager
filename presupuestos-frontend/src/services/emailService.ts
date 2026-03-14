import { apiRequest } from "../api/client";
import { Email } from "../types/email";

export const emailService = {
  list: (tenantId: string) => apiRequest<Email[]>("/emails", { tenantId }),
  get: (tenantId: string, id: string) => apiRequest<Email>(`/emails/${id}`, { tenantId }),
};
