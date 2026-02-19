// src/core/application/services/ConversationService.ts

import type { ConversationRepository } from "../../../infrastructure/repositories";
import type {
  Conversation,
  ConversationWithMessages,
} from "../../../interfaces";

const DEFAULT_CHANNEL = "widget-web";

export class ConversationService {
  private readonly repository: ConversationRepository;

  constructor(repository: ConversationRepository) {
    this.repository = repository;
  }

  getConversations(): Promise<Conversation[]> {
    return this.repository.getAll();
  }

  getConversationWithMessages(id: string): Promise<ConversationWithMessages> {
    return this.repository.getWithMessages(id);
  }

  /**
   * Crea una conversación usando siempre el canal por defecto del widget.
   * Desde fuera solo hace falta pasar el título.
   */
  createConversation(title: string): Promise<Conversation> {
    const trimmedTitle = title.trim();
    return this.repository.create(trimmedTitle, DEFAULT_CHANNEL);
  }

  deleteConversation(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
