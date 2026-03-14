import { apiRequest } from "../api/client";
import {
  Formula,
  FormulaCreateRequest,
  FormulaUpdateRequest,
} from "../types/formula";

export const formulasService = {
  list: (tenantId: string, activeOnly = false) =>
    apiRequest<Formula[]>(`/formulas${activeOnly ? "?active=true" : ""}`, {
      tenantId,
    }),
  create: (tenantId: string, payload: FormulaCreateRequest) =>
    apiRequest<Formula>("/formulas", {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  update: (tenantId: string, id: string, payload: FormulaUpdateRequest) =>
    apiRequest<Formula>(`/formulas/${id}`, {
      method: "PUT",
      tenantId,
      body: JSON.stringify(payload),
    }),
  remove: (tenantId: string, id: string) =>
    apiRequest<void>(`/formulas/${id}`, { method: "DELETE", tenantId }),
};
