// src/infrastructure/repositories/ConversationRepository.ts
import { fetchWithAuth } from "../api/api";
import { API_ENDPOINTS } from "../../core/domain/constants/apiEndpoints";
import type { Conversation, ConversationWithMessages, ChatMessage } from "../../interfaces";
import {
  getModel,
  getProviderId,
  getServiceCode,
} from "../config/env";

interface PaginatedConversations {
  pageSize: number;
  pageNumber: number;
  totalRegisters: number;
  list: Conversation[];
}

export class ConversationRepository {
  async getAll(): Promise<Conversation[]> {
    const raw = await fetchWithAuth<any>(API_ENDPOINTS.CONVERSATIONS);
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
    const messages = await fetchWithAuth<ChatMessage[]>(
      API_ENDPOINTS.CONVERSATION_MESSAGES(id)
    );
    return {
      id,
      title: "",
      createdAt: new Date().toISOString(),
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

  async delete(id: string): Promise<void> {
    throw new Error("Eliminar conversaciones no está disponible.");
  }
}
