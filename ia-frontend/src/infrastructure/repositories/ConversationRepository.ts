// src/infrastructure/repositories/ConversationRepository.ts
import { ApiError, fetchWithAuth } from "../api/api";
import { API_ENDPOINTS } from "../../core/domain/constants/apiEndpoints";
import type {
  Conversation,
  ConversationWithMessages,
  ChatMessage,
} from "../../interfaces";
import { getModel, getProviderId, getServiceCode } from "../config/env";

interface PaginatedConversations {
  pageSize: number;
  pageNumber: number;
  totalRegisters: number;
  list: Conversation[];
}

export class ConversationRepository {
  async getAll(): Promise<Conversation[]> {
    let raw: any;
    try {
      raw = await fetchWithAuth<any>(API_ENDPOINTS.CONVERSATIONS);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return [];
      }
      throw err;
    }
    if (Array.isArray(raw)) {
      return raw as Conversation[];
    }
    if (
      raw &&
      typeof raw === "object" &&
      Array.isArray((raw as PaginatedConversations).list)
    ) {
      const paginated = raw as PaginatedConversations;
      return paginated.list;
    }
    return [];
  }

  async getWithMessages(id: string): Promise<ConversationWithMessages> {
    let detail: Conversation | null = null;
    try {
      detail = await fetchWithAuth<Conversation>(API_ENDPOINTS.CONVERSATION_DETAIL(id));
    } catch {
      detail = null;
    }
    const rawMessages = await fetchWithAuth<ChatMessage[]>(
      API_ENDPOINTS.CONVERSATION_MESSAGES(id),
    );
    const messages = Array.isArray(rawMessages)
      ? rawMessages.map((msg) => {
          if (msg && typeof (msg as any).attachments === "string") {
            try {
              const parsed = JSON.parse((msg as any).attachments as string);
              return {
                ...msg,
                attachments: Array.isArray(parsed) ? parsed : [],
              };
            } catch {
              return { ...msg, attachments: [] };
            }
          }
          return msg;
        })
      : [];
    return {
      id,
      title: detail?.title ?? "",
      serviceCode: detail?.serviceCode,
      providerId: detail?.providerId,
      model: detail?.model,
      tenantId: detail?.tenantId,
      userId: detail?.userId,
      handoffStatus: detail?.handoffStatus ?? null,
      handoffReason: detail?.handoffReason ?? null,
      handoffRequestedAt: detail?.handoffRequestedAt ?? null,
      handoffAcceptedAt: detail?.handoffAcceptedAt ?? null,
      handoffResolvedAt: detail?.handoffResolvedAt ?? null,
      createdAt: detail?.createdAt ?? new Date().toISOString(),
      updatedAt: detail?.updatedAt ?? undefined,
      messages,
    };
  }

  async create(title: string): Promise<Conversation> {
    const serviceCode = getServiceCode();
    const providerId = getProviderId();
    const model = getModel();
    return await fetchWithAuth<Conversation>(API_ENDPOINTS.CONVERSATIONS, {
      method: "POST",
      body: JSON.stringify({
        title,
        serviceCode,
        providerId,
        model,
      }),
    });
  }

  // async delete(id: string): Promise<void> {
  //   throw new Error("Eliminar conversaciones no está disponible.");
  // }
}
