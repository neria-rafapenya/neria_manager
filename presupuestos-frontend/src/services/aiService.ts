import { apiRequest } from "../api/client";
import { AiParseRequest, AiParseResponse, AiRequestLog } from "../types/ai";

export const aiService = {
  parse: (tenantId: string, payload: AiParseRequest) =>
    apiRequest<AiParseResponse>("/ai/parse-request", {
      method: "POST",
      tenantId,
      body: JSON.stringify(payload),
    }),
  logs: (tenantId: string, params: { from?: string; to?: string; onlyErrors?: boolean }) => {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.onlyErrors !== undefined) query.set("onlyErrors", String(params.onlyErrors));
    const suffix = query.toString();
    return apiRequest<AiRequestLog[]>(`/ai/logs${suffix ? `?${suffix}` : ""}`, { tenantId });
  },
};
