// src/interfaces/chat/ChatMessage.ts

import type { ChatAttachment } from "./Attachment";

export type ChatMessageRole = "user" | "assistant" | "system" | "human";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt?: any;
  conversationId?: string;
  tenantId?: string;
  userId?: string;
  attachments?: ChatAttachment[];
}
