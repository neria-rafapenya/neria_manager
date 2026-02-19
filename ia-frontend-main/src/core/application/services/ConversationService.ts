// src/core/application/services/ConversationService.ts

import type { ConversationRepository } from "../../../infrastructure/repositories";
import type {
  Conversation,
  ConversationWithMessages,
} from "../../../interfaces";

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

  createConversation(title: string): Promise<Conversation> {
    const trimmedTitle = title.trim();
    return this.repository.create(trimmedTitle);
  }

  deleteConversation(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
