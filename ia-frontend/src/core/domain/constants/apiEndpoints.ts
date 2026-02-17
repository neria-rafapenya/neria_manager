// src/core/domain/constants/apiEndpoints.ts
export const API_ENDPOINTS = {
  AUTH_LOGIN: "/tenant/chat/auth/login",

  SERVICES: "/chat/services",
  SERVICE_ENDPOINTS: (serviceCode: string) =>
    `/chat/services/${serviceCode}/endpoints`,

  CONVERSATIONS: "/chat/conversations",
  CONVERSATION_DETAIL: (id: string) => `/chat/conversations/${id}`,
  CONVERSATION_MESSAGES: (id: string) =>
    `/chat/conversations/${id}/messages`,
  CONVERSATION_MESSAGES_STREAM: (id: string) =>
    `/chat/conversations/${id}/messages/stream`,
  CONVERSATION_HANDOFF: (id: string) =>
    `/chat/conversations/${id}/handoff`,

  CHAT_UPLOADS: "/chat/uploads",
  CHAT_MESSAGE: "/chat/conversations",
} as const;
