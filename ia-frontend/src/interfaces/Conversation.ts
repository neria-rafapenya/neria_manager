// src/interfaces/chat/Conversation.ts

import type { ChatMessage } from "./ChatMessage";

export interface Conversation {
  id: string;
  title?: string | null;
  channel?: string;
  serviceCode?: string;
  providerId?: string;
  model?: string;
  tenantId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}
