// src/infrastructure/repositories/ChatRepository.ts

import { API_ENDPOINTS } from "../../core/domain/constants/apiEndpoints";
import type { ChatAttachment, Conversation } from "../../interfaces";
import {
  getModel,
  getProviderId,
  getServiceCode,
} from "../config/env";
import { fetchWithAuth } from "../api/api";

export interface SendMessagePayload {
  conversationId: string | null;
  message: string;
  attachments?: ChatAttachment[];
}

/**
 * Repositorio de chat con soporte streaming.
 *
 * Soporta varios formatos de evento:
 *  - { "delta": "texto", "conversationId": "..." }
 *  - { "content": "texto" }
 *  - { "message": "texto" }
 *  - { "delta": { "text": "texto" } }
 *  - { "delta": { "content": "texto" } }
 *  - { "choices": [ { "delta": { "content": "texto" } } ] }  (estilo OpenAI)
 *  - texto plano en una sola respuesta
 */
export class ChatRepository {

  private mapAttachmentsForApi(attachments?: ChatAttachment[]) {
    if (!attachments || attachments.length == 0) return [];
    return attachments.map((att) => ({
      fileId: att.fileId,
      url: att.url,
      name: att.filename || att.name || att.key,
      contentType: att.mimeType || att.contentType || "",
      size: att.sizeBytes || att.size || 0,
      provider: att.provider,
      storageKey: att.storageKey || att.key,
    }));
  }

  async sendMessageStream(
    payload: SendMessagePayload,
    onDelta: (delta: string, newConversationId: string | null) => void
  ): Promise<{ conversationId: string | null }> {
    let conversationId: string | null = payload.conversationId ?? null;

    console.info("[ChatRepository] sendMessageStream:start", {
      conversationId,
      messagePreview: payload.message?.slice(0, 80),
    });

    if (!conversationId) {
      const serviceCode = getServiceCode();
      const providerId = getProviderId();
      const model = getModel();
      console.info("[ChatRepository] createConversation", {
        serviceCode,
        providerId,
        model,
      });
      const created = await fetchWithAuth<Conversation>(API_ENDPOINTS.CONVERSATIONS, {
        method: "POST",
        body: JSON.stringify({
          title: payload.message.slice(0, 48) || "Conversación",
          serviceCode,
          providerId,
          model,
        }),
      });
      conversationId = created.id;
      console.info("[ChatRepository] conversationCreated", {
        conversationId,
      });
    }

    if (!conversationId) {
      throw new Error("No se pudo crear la conversación.");
    }

    console.info("[ChatRepository] stream:request", {
      conversationId,
      endpoint: API_ENDPOINTS.CONVERSATION_MESSAGES_STREAM(conversationId),
    });
    const response = await fetchWithAuth<Response>(
      API_ENDPOINTS.CONVERSATION_MESSAGES_STREAM(conversationId),
      {
        method: "POST",
        body: JSON.stringify({ content: payload.message, attachments: this.mapAttachmentsForApi(payload.attachments) }),
        rawResponse: true,
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn("[ChatRepository] stream:response:error", {
        status: response.status,
        body: text,
      });
      throw new Error(
        `Error en streaming (status ${response.status}): ${text || "sin detalle"}`
      );
    }

    if (!response.body) {
      throw new Error("El servidor no soporta streaming.");
    }

    console.info("[ChatRepository] stream:response:ok", {
      status: response.status,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let resolvedConversationId: string | null = conversationId;

    const flushEvent = (rawEvent: string) => {
      const lines = rawEvent.split("\n");
      let data = "";
      for (const line of lines) {
        if (line.startsWith("data:")) {
          data += line.replace(/^data:\s?/, "");
        }
      }
      if (!data) return;
      try {
        const parsed = JSON.parse(data) as {
          delta?: string;
          conversationId?: string;
          done?: boolean;
          debug?: {
            endpoints?: unknown;
          };
        };
        if (parsed.debug?.endpoints) {
          console.info("[ChatRepository] endpoint:debug", parsed.debug.endpoints);
        }
        if (parsed.conversationId) {
          resolvedConversationId = parsed.conversationId;
        }
        if (parsed.delta) {
          onDelta(parsed.delta, resolvedConversationId);
        }
      } catch {
        onDelta(data, resolvedConversationId);
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sepIndex = buffer.indexOf("\n\n");
      while (sepIndex !== -1) {
        const rawEvent = buffer.slice(0, sepIndex).trim();
        buffer = buffer.slice(sepIndex + 2);
        if (rawEvent) {
          flushEvent(rawEvent);
        }
        sepIndex = buffer.indexOf("\n\n");
      }
    }

    if (buffer.trim()) {
      flushEvent(buffer.trim());
    }

    return { conversationId: resolvedConversationId };
  }

  async requestHandoff(conversationId: string, reason?: string): Promise<void> {
    await fetchWithAuth(API_ENDPOINTS.CONVERSATION_HANDOFF(conversationId), {
      method: "POST",
      body: JSON.stringify({ reason: reason ?? "" }),
    });
  }

  async resolveHandoff(conversationId: string): Promise<void> {
    await fetchWithAuth(API_ENDPOINTS.CONVERSATION_HANDOFF_RESOLVE(conversationId), {
      method: "POST",
    });
  }

  async createJiraIssue(
    conversationId: string,
    messageContent: string
  ): Promise<any> {
    return fetchWithAuth(API_ENDPOINTS.CONVERSATION_JIRA_ISSUES(conversationId), {
      method: "POST",
      body: JSON.stringify({ messageContent }),
    });
  }
}
