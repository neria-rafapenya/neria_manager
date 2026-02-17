// src/interfaces/chat/ChatMessage.ts

import type { ChatAttachment } from "./Attachment";

export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt?: string;
  conversationId?: string;
  tenantId?: string;
  userId?: string;
  attachments?: ChatAttachment[];
}
