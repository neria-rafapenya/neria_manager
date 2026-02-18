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
  CONVERSATION_HANDOFF_RESOLVE: (id: string) =>
    `/chat/conversations/${id}/handoff/resolve`,
  CONVERSATION_JIRA_ISSUES: (id: string) =>
    `/chat/conversations/${id}/jira-issues`,
  CONVERSATION_UPLOADS: (id: string) =>
    `/chat/conversations/${id}/uploads`,
  CONVERSATION_FILES: (id: string) =>
    `/chat/conversations/${id}/files`,

  CHAT_UPLOADS: "/chat/uploads",
  CHAT_MESSAGE: "/chat/conversations",
} as const;
