import { apiRequest } from "../api/client";
import {
  Quote,
  QuoteAttachment,
  QuoteAttachmentCreateRequest,
  QuoteCalculationRequest,
  QuoteCalculationResponse,
  QuoteCreateRequest,
  QuoteUpdateRequest,
} from "../types/quote";

export const quotesService = {
  list: (tenantId: string) => apiRequest<Quote[]>("/quotes", { tenantId }),
  get: (tenantId: string, id: string) => apiRequest<Quote>(`/quotes/${id}`, { tenantId }),
  create: (tenantId: string, payload: QuoteCreateRequest) =>
    apiRequest<Quote>("/quotes", {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  update: (tenantId: string, id: string, payload: QuoteUpdateRequest) =>
    apiRequest<Quote>(`/quotes/${id}`, {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
  calculate: (tenantId: string, payload: QuoteCalculationRequest) =>
    apiRequest<QuoteCalculationResponse>("/quote/calculate", {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  listAttachments: (tenantId: string, quoteId: string) =>
    apiRequest<QuoteAttachment[]>(`/quotes/${quoteId}/attachments`, { tenantId }),
  addAttachment: (tenantId: string, quoteId: string, payload: QuoteAttachmentCreateRequest) =>
    apiRequest<QuoteAttachment>(`/quotes/${quoteId}/attachments`, {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  exportPdf: (tenantId: string, quoteId: string) =>
    apiRequest<QuoteAttachment>(`/quotes/${quoteId}/export/pdf`, {
      method: "POST",
      tenantId,
    }),
  sendEmail: (tenantId: string, quoteId: string) =>
    apiRequest<void>(`/quotes/${quoteId}/send-email`, {
      method: "POST",
      tenantId,
    }),
};
