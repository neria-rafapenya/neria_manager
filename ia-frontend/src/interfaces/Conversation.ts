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
  handoffStatus?: "none" | "requested" | "active" | "resolved" | null;
  handoffReason?: string | null;
  handoffRequestedAt?: string | null;
  handoffAcceptedAt?: string | null;
  handoffResolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}
