// src/core/application/services/ChatService.ts
import type { ChatRepository } from "../../../infrastructure/repositories";
import type { ChatAttachment } from "../../../interfaces";

export class ChatService {
  private readonly repository: ChatRepository;

  constructor(repository: ChatRepository) {
    this.repository = repository;
  }

  async sendMessage(
    params: {
      conversationId?: string | null;
      message: string;
      attachments?: ChatAttachment[];
    },
    onPartial: (delta: string, conversationId: string | null) => void
  ): Promise<{ conversationId: string | null }> {
    return this.repository.sendMessageStream(
      {
        conversationId: params.conversationId ?? null,
        message: params.message,
        attachments: params.attachments ?? [],
      },
      (delta, conversationId) => {
        onPartial(delta, conversationId);
      }
    );
  }
}
